<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		listPartitionsIDs,
		loadShallowPartitions,
		createPartition,
	} from '$lib/services/repository';
	import type { LionWebJsonChunk } from '@lionweb/server-client';
	import { goto } from '$app/navigation';
	import type { LionWebJsonMetaPointer } from '@lionweb/json';
	import PartitionCard from '$lib/components/PartitionCard.svelte';
	import { getNodeName } from '$lib/utils/noderendering';
	import { ImageUpIcon, ChevronDownIcon, ChevronUpIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	type ViewMode = 'chronological' | 'grouped' | 'alphabetical';
	let viewMode: ViewMode = 'chronological';
	let collapsedGroups = $state(new SvelteSet<string>());

	let repositoryName = $state(page.params.repository);
	type PartitionEntry = { id: string; name?: string; isLoaded?: boolean; data?: LionWebJsonChunk; metapointer?: LionWebJsonMetaPointer };
	let partitions: Array<PartitionEntry> = $state([]);
	let loading = $state(false);
	let error: string | null = $state(null);
	let dragActive = $state(false);

	repositoryName = page.params.repository;
	loadPartitions();

	// Compute organized partitions based on view mode
	let organizedPartitions = $derived(organizePartitions(partitions, viewMode));

	function organizePartitions(partitions: Array<PartitionEntry>, mode: ViewMode) {
		switch (mode) {
			case 'chronological':
				return { type: 'list' as const, items: [...partitions] };
			case 'grouped':
				const groups = new Map<string, typeof partitions>();
				partitions.forEach(partition => {
					const group = partition.metapointer!!.language+":"+partition.metapointer!!.version+":"+partition.metapointer!!.key;
					if (!groups.has(group)) {
						groups.set(group, []);
					}
					groups.get(group)!.push(partition);
				});
				const metapointers = [...groups.keys()].sort((a, b) => {
					const partsA = a.split(":")
					const partsB = b.split(":")
					const languageComparison = partsA[0].localeCompare(partsB[0]);
					if (languageComparison !== 0) return languageComparison;

					const versionComparison = partsA[1].localeCompare(partsB[1]);
					if (versionComparison !== 0) return versionComparison;

					return partsA[2].localeCompare(partsB[2]);
				});
				return {
					type: 'grouped' as const,
					groups: Array.from(metapointers).map(mp => ({
						mp,
						items: groups.get(mp)
					}))
				};
			case 'alphabetical':
				const namedGroup = {
					name: 'Named Partitions',
					items: partitions.filter(partition => partition.name).sort((a, b) => a.name!!.localeCompare(b.name!!))
				};
				const unnamedGroup = {
					name: 'Unnamed Partitions',
					items: partitions.filter(partition => !partition.name).sort((a, b) => a.id.localeCompare(b.id))
				};
				return {
					type: 'grouped' as const,
					groups: [namedGroup, unnamedGroup],
				};
		}
	}

	async function loadPartitions() {
		if (!repositoryName) return;

		loading = true;
		error = null;

		try {
			const partitionsIDs = await listPartitionsIDs(repositoryName);
			partitions = partitionsIDs.map((id) => ({ id:id, isLoaded: false }));

			// Load shallow data for all partitions in a single request
			try {
				const partitionsData = await loadShallowPartitions(repositoryName, partitionsIDs);
				// Process each root node to extract names
				for (const partition of partitions) {
					const rootNode = partitionsData.get(partition.id)!!;
					partition.name = getNodeName(rootNode);
					partition.metapointer = rootNode.classifier;
				}
			} catch (e) {
				console.error('Error loading partition names:', e);
			}
		} catch (e) {
			error = `Failed to load partitions: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	async function handleLoadPartition(partition: { id: string }) {
		try {
			loading = true;
			error = null;

			// Navigate to the exploration state
			await goto(`/repository/${repositoryName}/node-${partition.id}`);
		} catch (e) {
			error = `Failed to load partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		try {
			loading = true;
			error = null;

			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (file.name.endsWith('.json')) {
					const content = await file.text();
					const jsonContent = JSON.parse(content);

					// Validate the basic structure
					if (!jsonContent.serializationFormatVersion || !Array.isArray(jsonContent.nodes)) {
						throw new Error('Invalid file format. Expected a LionWeb serialization chunk.');
					}

					await handleCreatePartition(jsonContent);
				}
			}

			// Show success message
			error = null;
		} catch (err) {
			error = `Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			loading = false;
		}
	}

	async function handleCreatePartition(originalChunk: LionWebJsonChunk) {
		try {
			loading = true;
			error = null;

			await createPartition(repositoryName!!, originalChunk);
			await loadPartitions();

			// Show success message
			error = null;
		} catch (e) {
			console.error('Error in handleCreatePartition:jsonContent', e);
			error = `Failed to create partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await loadPartitions();
	});
</script>

<div class="relative min-h-screen">
	<!-- Background Logo -->
	<div class="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.02]">
		<img src="/images/lionweb-logo.png" alt="" class="h-[800px] w-[800px] object-contain" />
	</div>

	<!-- Drag and Drop Area -->
	<div class="rounded-lg bg-white shadow mb-4">
		<div class="px-4 py-5 sm:p-6">
			<div
				class="rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ease-in-out"
				class:border-indigo-600={dragActive}
				class:border-gray-300={!dragActive}
				class:bg-indigo-50={dragActive}
				on:dragenter={handleDragEnter}
				on:dragleave={handleDragLeave}
				on:dragover={handleDragOver}
				on:drop={handleDrop}
			>
				<div class="text-gray-600">
					<div  class="inline-flex justify-center items-center"><ImageUpIcon/></div>
					<p class="mt-2">Drag and drop a LionWeb JSON file here to create a new partition</p>
					<p class="mt-1 text-sm text-gray-500">
						The file should contain a valid LionWeb serialization chunk
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Partitions List -->
	<div class="rounded-lg bg-white shadow">
		<div class="px-4 py-5 sm:p-6">
			<div class="mb-6 flex items-center justify-end">
				<!-- View Mode Selector -->
				<div class="flex items-center space-x-2">
					<label for="view-mode" class="text-sm font-medium text-gray-700">Sort by:</label>
					<select
						id="view-mode"
						bind:value={viewMode}
						class="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
					>
						<option value="chronological">Chronological</option>
						<option value="grouped">Grouped by Type</option>
						<option value="alphabetical">Alphabetical</option>
					</select>
				</div>
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
				</div>
			{:else if partitions.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">No partitions found in repository "{repositoryName}"</p>
				</div>
			{:else}
				{#if organizedPartitions.type === 'list'}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each organizedPartitions.items as partition}
							<PartitionCard {partition} onClick={handleLoadPartition} on:deleted={loadPartitions} />
						{/each}
					</div>
				{:else}
					<div class="space-y-8">
						{#each organizedPartitions.groups as group}
							<div>
								<button
									class="flex items-center justify-between w-full text-left text-lg font-medium text-gray-900 mb-4 hover:text-indigo-600"
									on:click={() => {
										const key = 'mp' in group ? group.mp : group.name;
										if (collapsedGroups.has(key)) {
											collapsedGroups.delete(key);
										} else {
											collapsedGroups.add(key);
										}
									}}
								>
									<div class="flex items-center gap-2">
										<span>{'mp' in group ? group.mp : group.name}</span>
										<span class="text-sm text-gray-500">({(group.items || []).length})</span>
									</div>
									{#if !collapsedGroups.has('mp' in group ? group.mp : group.name)}
										<ChevronUpIcon/>
										{:else}
										<ChevronDownIcon/>
										{/if}
								</button>
								{#if !collapsedGroups.has('mp' in group ? group.mp : group.name)}
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{#each (group.items || []) as partition}
											<PartitionCard {partition} onClick={handleLoadPartition} on:deleted={loadPartitions} />
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
