<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		listPartitionsIDs,
		loadPartitionNames
	} from '$lib/services/repository';
	import type { LionWebJsonChunk } from '@lionweb/server-client';
	import { goto } from '$app/navigation';

	let repositoryName = $derived(page.params.repository);
	let partitions: Array<{ id: string; name?: string; isLoaded?: boolean; data?: LionWebJsonChunk }> = $state([]);
	let loading = $state(false);
	let error: string | null = $state(null);
	let dragActive = $state(false);

	async function loadPartitions() {
		if (!repositoryName) return;

		loading = true;
		error = null;

		try {
			const partitionsIDs = await listPartitionsIDs(repositoryName);
			partitions = partitionsIDs.map((id) => ({ id:id, isLoaded: false }));
			
			// Load shallow data for all partitions in a single request
			try {
				const partitionNames = await loadPartitionNames(repositoryName, partitionsIDs);
				// Process each root node to extract names
				for (const partition of partitions) {
					partition.name = partitionNames.get(partition.id);
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
			await goto(`/${repositoryName}/node-${partition.id}`);
		} catch (e) {
			error = `Failed to load partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
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

	<div class="rounded-lg bg-white shadow">
		<div class="px-4 py-5 sm:p-6">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-900">Partitions in Repository {repositoryName}</h2>
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
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					Partitions found:
					{#each partitions.sort((a, b) => a.id.localeCompare(b.id)) as partition}
						<!-- svelte-ignore <a11y_click_events_have_key_events> -->
						<!-- svelte-ignore <a11y_no_noninteractive_element_interactions> -->
						<div 
							role="insertion"
							class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow duration-200 cursor-pointer"
							onclick={() => handleLoadPartition(partition)}
						>
							<div class="px-6 py-4">
								<div class="flex flex-col">
									<div class="flex items-center justify-between mb-4">
										<div class="flex items-center gap-3">
											<div class="min-w-0">
												{#if partition.name}
													<h3 class="text-lg font-semibold text-gray-900">{partition.name}</h3>												
												{/if}
												<p class="text-xs text-gray-500 uppercase tracking-wide break-all max-w-[200px]">{partition.id}</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div> 
