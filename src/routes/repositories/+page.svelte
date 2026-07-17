<script lang="ts">
	import { onMount } from 'svelte';
	import { getRepositories, createRepository, deleteRepository, downloadRepositoryAsZip, uploadRepositoryFromZip, getPartitionsCount } from '$lib/services/repository';
	import type { RepositoryConfiguration } from '@lionweb/server-shared';
	import CreateRepositoryModal from '$lib/components/modals/CreateRepositoryModal.svelte';
	import DeleteConfirmationModal from '$lib/components/modals/DeleteConfirmationModal.svelte';
	import DownloadProgressModal from '$lib/components/modals/DownloadProgressModal.svelte';
	import UploadProgressModal from '$lib/components/modals/UploadProgressModal.svelte';
	import ExistingPartitionDialog from '$lib/components/modals/ExistingPartitionDialog.svelte';

	let repositories: RepositoryConfiguration[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);
	let showCreateModal = $state(false);
	let showDeleteConfirm = $state(false);
	let repositoryToDelete: RepositoryConfiguration | null = $state(null);
	let createError: string | null = $state(null);
	let dragActiveRepository: string | null = $state(null);
	let showDownloadProgress = $state(false);
	let downloadProgress = $state({ current: 0, total: 0 });
	let showUploadProgress = $state(false);
	let uploadProgress = $state({ current: 0, total: 0 });
	let showExistingPartitionDialog = $state(false);
	let currentPartitionId: string | null = $state(null);
	let existingPartitionResolver: ((value: 'skip' | 'replace') => void) | null = $state(null);
	let uploadAction: 'skip' | 'replace' | null =$state( null);
	let applyToAll = $state(false);
	let partitionCounts: { [key: string]: number | null } = $state({});
	let loadingPartitionCounts: { [key: string]: boolean } = $state({});

	// Add drag counter to handle nested elements
	let dragCounters: { [key: string]: number } = $state({});

	onMount(async () => {
		await loadRepositories();
	});

	async function loadRepositories() {
		try {
			loading = true;
			error = null;
			const response = await getRepositories();
			if (response.success) {
				repositories = response.repositories;
				// Initialize partition counts
				repositories.forEach(repo => {
					partitionCounts[repo.name] = null;
					loadingPartitionCounts[repo.name] = false;
				});
				// Start loading partition counts
				repositories.forEach(repo => loadPartitionCount(repo.name));
			} else {
				error = response.messages[0]?.message || 'Failed to load repositories';
			}
		} catch (e) {
			error = `Failed to load repositories: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function loadPartitionCount(repositoryName: string) {
		if (loadingPartitionCounts[repositoryName]) return;

		try {
			loadingPartitionCounts[repositoryName] = true;
			const count = await getPartitionsCount(repositoryName);
			partitionCounts = { ...partitionCounts, [repositoryName]: count };
		} catch (e) {
			console.error(`Error loading partition count for ${repositoryName}:`, e);
			partitionCounts = { ...partitionCounts, [repositoryName]: null };
		} finally {
			loadingPartitionCounts = { ...loadingPartitionCounts, [repositoryName]: false };
		}
	}

	async function handleCreateRepository(newRepository: RepositoryConfiguration) {
		try {
			loading = true;
			error = null;
			createError = null;

			// Basic validation
			if (!newRepository.name.trim()) {
				createError = 'Repository name is required';
				return;
			}

			if (!/^[a-zA-Z0-9_-]+$/.test(newRepository.name)) {
				createError = 'Repository name can only contain letters, numbers, underscores, and hyphens';
				return;
			}

			await createRepository(newRepository);

			// Reset form and close modal
			newRepository = {
				name: '',
				lionweb_version: '2024.1',
				history: false
			};
			showCreateModal = false;

			// Reload the list
			await loadRepositories();
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create repository';
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function handleDeleteRepository() {
		if (!repositoryToDelete) return;

		try {
			loading = true;
			error = null;

			await deleteRepository(repositoryToDelete.name);

			// Reset state and close modal
			repositoryToDelete = null;
			showDeleteConfirm = false;

			// Reload the list
			await loadRepositories();
		} catch (e) {
			error = `Failed to delete repository: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function handleDownload(repositoryName: string) {
		try {
			loading = true;
			error = null;
			showDownloadProgress = true;
			downloadProgress = { current: 0, total: 0 };

			const blob = await downloadRepositoryAsZip(repositoryName, (current, total) => {
				downloadProgress = { current, total };
			});

			// Create and trigger download
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${repositoryName}.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to download repository';
			console.error('Error details:', e);
		} finally {
			loading = false;
			showDownloadProgress = false;
		}
	}

	function handleDragEnter(e: DragEvent, repositoryName: string) {
		e.preventDefault();
		e.stopPropagation();

		// Initialize counter if needed
		if (dragCounters[repositoryName] === undefined) {
			dragCounters[repositoryName] = 0;
		}

		dragCounters[repositoryName]++;

		// Only set active when first entering
		if (dragCounters[repositoryName] === 1) {
			dragActiveRepository = repositoryName;
		}
	}

	function handleDragLeave(e: DragEvent, repositoryName: string) {
		e.preventDefault();
		e.stopPropagation();

		// Decrement counter
		dragCounters[repositoryName]--;

		// Only remove active state when actually leaving the entire element
		if (dragCounters[repositoryName] === 0) {
			if (dragActiveRepository === repositoryName) {
				dragActiveRepository = null;
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleDrop(e: DragEvent, repositoryName: string) {
		e.preventDefault();
		e.stopPropagation();
		dragActiveRepository = null;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		if (file.type !== 'application/zip' && !file.name.endsWith('.zip')&& !file.name.endsWith('.sps')) {
			error = 'Please drop a ZIP file to import partitions';
			return;
		}

		try {
			loading = true;
			error = null;
			showUploadProgress = true;
			uploadProgress = { current: 0, total: 0 };
			uploadAction = null;
			applyToAll = false;

			console.time('loadPartitions');
			await uploadRepositoryFromZip(
				file,
				repositoryName,
				(current, total) => {
					uploadProgress = { current, total };
				},

				async (partitionId) => {
					if (uploadAction && applyToAll) {
						return uploadAction;
					}

					return new Promise((resolve) => {
						currentPartitionId = partitionId;
						existingPartitionResolver = resolve;
						showExistingPartitionDialog = true;
					});
				}
			);
			console.timeEnd('loadPartitions');
			await loadRepositories();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to import partitions';
			console.error('Error details:', e);
		} finally {
			loading = false;
			showUploadProgress = false;
			showExistingPartitionDialog = false;
			currentPartitionId = null;
			existingPartitionResolver = null;
		}
	}

	function handleExistingPartitionAction(action: 'skip' | 'replace', applyAll: boolean) {
		if (!existingPartitionResolver) return;

		if (applyAll) {
			uploadAction = action;
			applyToAll = true;
		}

		existingPartitionResolver(action);
		showExistingPartitionDialog = false;
		existingPartitionResolver = null;
		currentPartitionId = null;
	}
</script>

<div class=" min-h-screen">
	<!-- Content -->
	<div class="rounded-lg bg-white shadow">
		<div class="px-4 py-5 sm:p-6">
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-gray-900">Repositories</h2>
			</div>

			{#if loading}
				<div class="py-12 text-center">
					<div
						class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
					></div>
				</div>
			{:else if error}
				<div class="py-12 text-center">
					<p class="text-red-600">{error}</p>
					<p class="mt-2 text-sm text-gray-500">
						Please check if the LionWeb Repository server is running at {import.meta.env
							.VITE_API_BASE_URL}
					</p>
				</div>
			{:else if repositories.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">No repositories found</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each repositories as repository}
						<div
							role="region"
							class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow relative {dragActiveRepository === repository.name ? 'ring-2 ring-indigo-500' : ''}"
							ondragenter={(e) => handleDragEnter(e, repository.name)}
							ondragleave={(e) => handleDragLeave(e, repository.name)}
							ondragover={handleDragOver}
							ondrop={(e) => handleDrop(e, repository.name)}
						>
							<!-- Drag overlay -->
							{#if dragActiveRepository === repository.name}
								<div class="absolute inset-0 bg-indigo-500 bg-opacity-50 flex items-center justify-center pointer-events-none">
									<div class="rounded-lg bg-white p-4 text-center shadow-lg">
										<p class="text-sm font-semibold text-gray-900">Drop ZIP file to import partitions</p>
									</div>
								</div>
							{/if}

							<div class="px-4 py-5 sm:p-6">
								<h3 class="mb-3 text-lg font-semibold text-gray-900">{repository.name}</h3>

								<div class="mb-4 flex flex-wrap gap-2">
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
									>
										{repository.lionweb_version}
									</span>
									{#if repository.history}
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
										>
											History Enabled
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
										>
											History Disabled
										</span>
									{/if}
								</div>
								<p class="text-sm text-gray-600 italic">
									{#if loadingPartitionCounts[repository.name]}
										Calculating number of partitions...
									{:else if partitionCounts[repository.name] !== null}
										{partitionCounts[repository.name]} partition{partitionCounts[repository.name] === 1 ? '' : 's'}
									{:else}
										Error loading partitions
									{/if}
								</p>

								<div class="flex justify-end space-x-2">
									<button
										onclick={() => handleDownload(repository.name)}
										class="inline-flex items-center rounded-full border border-transparent p-2 text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
										title="Download Repository"
									>
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
										<span class="sr-only">Download</span>
									</button>
									<a
										href="/repository/{repository.name}"
										class="inline-flex items-center rounded-full border border-transparent p-2 text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
										title="Explore Repository"
									>
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
											/>
										</svg>
										<span class="sr-only">Explore</span>
									</a>
									<button
										onclick={() => {
											repositoryToDelete = repository;
											showDeleteConfirm = true;
										}}
										class="inline-flex items-center rounded-full border border-transparent p-2 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
										title="Delete Repository"
									>
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
												clip-rule="evenodd"
											/>
										</svg>
										<span class="sr-only">Delete</span>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="mt-6 flex justify-center">
				<button
					onclick={() => (showCreateModal = true)}
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					<svg
						class="mr-2 h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
							clip-rule="evenodd"
						/>
					</svg>
					Create Repository
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Modals -->
<CreateRepositoryModal
	show={showCreateModal}
	onClose={() => (showCreateModal = false)}
	onCreate={handleCreateRepository}
/>

<DeleteConfirmationModal
	show={showDeleteConfirm}
	repository={repositoryToDelete}
	onClose={() => {
		repositoryToDelete = null;
		showDeleteConfirm = false;
	}}
	onConfirm={handleDeleteRepository}
/>

<DownloadProgressModal
	show={showDownloadProgress}
	progress={downloadProgress}
/>

<UploadProgressModal
	show={showUploadProgress}
	progress={uploadProgress}
/>

<ExistingPartitionDialog
	show={showExistingPartitionDialog}
	partitionId={currentPartitionId}
	onAction={handleExistingPartitionAction}
/>
