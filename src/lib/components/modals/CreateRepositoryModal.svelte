<script lang="ts">
	import type { CreateRepositoryProps } from '$lib/components/modals/ModalProps';
	import type { RepositoryConfiguration } from '@lionweb/server-shared';

	let { show, onClose, onCreate }: CreateRepositoryProps = $props()

	let createError: string | null = $state(null);
	let newRepository: RepositoryConfiguration = {
		name: '',
		lionweb_version: '2024.1',
		history: false
	};

	async function handleCreateRepository() {
		try {
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

			await onCreate(newRepository);

			// Reset form and close modal
			newRepository = {
				name: '',
				lionweb_version: '2024.1',
				history: false
			};
			onClose();
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create repository';
			console.error('Error details:', e);
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
			aria-hidden="true"
		></div>
		<div class="fixed inset-0 z-60 flex items-center justify-center px-4 text-center">
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
			<div
				class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
			>
				<div>
					<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
						Create New Repository
					</h3>
					<div class="mt-4">
						<form on:submit|preventDefault={handleCreateRepository}>
							{#if createError}
								<div class="mb-4 border-l-4 border-red-400 bg-red-50 p-4">
									<div class="flex">
										<div class="ml-3">
											<p class="text-sm text-red-700">Error {createError}</p>
										</div>
									</div>
								</div>
							{/if}
							<div class="space-y-4">
								<div>
									<label for="name" class="block text-sm font-medium text-gray-700"
										>Repository Name</label
									>
									<input
										type="text"
										name="name"
										id="name"
										bind:value={newRepository.name}
										required
										pattern="[\w\-]+"
										title="Repository name can only contain letters, numbers, underscores, and hyphens"
										class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									/>
									<p class="mt-1 text-xs text-gray-500">
										Only letters, numbers, underscores, and hyphens are allowed
									</p>
								</div>
								<div>
									<label for="lionweb_version" class="block text-sm font-medium text-gray-700"
										>LionWeb Version</label
									>
									<select
										id="lionweb_version"
										name="lionweb_version"
										bind:value={newRepository.lionweb_version}
										class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									>
										<option value="2023.1">2023.1</option>
										<option value="2024.1">2024.1</option>
									</select>
								</div>
								<div class="flex items-center">
									<input
										type="checkbox"
										id="history"
										name="history"
										bind:checked={newRepository.history}
										class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<label for="history" class="ml-2 block text-sm text-gray-900"
										>Enable History Support</label
									>
								</div>
							</div>
							<div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
								<button
									type="submit"
									class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:col-start-2 sm:text-sm"
								>
									Create
								</button>
								<button
									type="button"
									on:click={onClose}
									class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:col-start-1 sm:mt-0 sm:text-sm"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if} 
