<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { listPartitionsIDs, loadPartitionNames } from '$lib/services/repository';
	import { onMount } from 'svelte';

	let partitions: Array<{ id: string; name?: string }> = [];
	let isOpen = false;
	let selected: { id: string; name?: string } | null = null;

	onMount(async () => {
		try {
			const repositoryName = $page.params.repository;
			if (!repositoryName) return;

			const partitionIDs = await listPartitionsIDs(repositoryName);
			partitions = partitionIDs.map(id => ({ id }));

			// Load partition names
			const partitionNames = await loadPartitionNames(repositoryName, partitionIDs);
			partitions = partitions.map(p => ({
				...p,
				name: partitionNames.get(p.id)
			}));

			// Set selected partition based on current URL
			const currentPartitionId = $page.params.id?.replace('node-', '');
			if (currentPartitionId) {
				selected = partitions.find(p => p.id === currentPartitionId) || null;
			}
		} catch (e) {
			console.error('Error loading partitions:', e);
		}
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectOption(partition: { id: string; name?: string }) {
		selected = partition;
		isOpen = false;
		goto(`/repository/${$page.params.repository}/node-${partition.id}`);
	}
</script>

<div class="custom-select">
	<div class="selected" on:click={toggleDropdown}>
		<div class="option-row">
			{#if selected}
				<span class="option-title">{selected.name || selected.id}</span>
			{:else}
				<span class="option-title">Select Partition</span>
			{/if}
		</div>
		<span class="arrow">{isOpen ? '▲' : '▼'}</span>
	</div>

	{#if isOpen}
		<ul class="options">
			{#each partitions as partition}
				<li class="option-row" on:click={() => selectOption(partition)}>
					<span class="option-title">{partition.name || partition.id}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
    .custom-select {
        position: relative;
        width: 100%;
        height: 100%;
        min-width: 200px;
        font-family: sans-serif;
    }

    .selected {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0.75rem;
        background: transparent;
        cursor: pointer;
        height: 100%;
        width: 100%;
    }

    .option-row {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        height: 100%;
    }

    .arrow {
        font-size: 12px;
        color: #666;
        margin-left: 1rem;
        flex-shrink: 0;
    }

    .options {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 1000;
        padding: 0.5rem 0;
        min-width: max-content;
        width: 100%;
    }

    .options .option-row {
        padding: 0.5rem 0.75rem;
        transition: background-color 0.2s ease;
    }

    .option-row:hover {
        background: #f3f4f6;
    }

    .option-title {
        font-weight: 500;
        color: #374151;
        margin-right: 0.5rem;
        flex-shrink: 0;
    }
</style>
