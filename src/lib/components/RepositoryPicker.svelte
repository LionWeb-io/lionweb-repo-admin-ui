<script lang="ts">
	import type { RepositoryConfiguration } from '@lionweb/server-shared';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getRepositories } from '$lib/services/repository';
	import { onMount } from 'svelte';

	let repositories: RepositoryConfiguration[] = $state([]);
	let isOpen = $state(false);
	let selected: RepositoryConfiguration | null = $state(null);

	onMount(async () => {
		try {
			const response = await getRepositories();
			if (response.success) {
				repositories = response.repositories;
				selected = repositories.find(r => r.name === page.params.repository) || repositories[0];
			}
		} catch (e) {
			console.error('Error loading repositories:', e);
		}
	});

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectOption(option: RepositoryConfiguration) {
		selected = option;
		isOpen = false;
		goto(`/repository/${option.name}`);
	}
</script>

<div class="custom-select">
	<div class="selected" on:click={toggleDropdown}>
		<div class="option-row">
			{#if selected}
				<span class="option-title">{selected.name}</span>
				<span class="badge version">{selected.lionweb_version}</span>
				<span class="badge history">{selected.history ? 'History enabled' : 'No history'}</span>
			{:else}
				<span class="option-title">Loading...</span>
			{/if}
		</div>
		<span class="arrow">{isOpen ? '▲' : '▼'}</span>
	</div>

	{#if isOpen}
		<ul class="options">
			{#each repositories as option}
				<li class="option-row" on:click={() => selectOption(option)}>
					<span class="option-title">{option.name}</span>
					<span class="badge version">{option.lionweb_version}</span>
					<span class="badge history">{option.history ? 'History enabled' : 'No history'}</span>
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
        min-width: 250px;
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

    .badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-weight: 500;
        flex-shrink: 0;
        white-space: nowrap;
    }

    .badge.version {
        color: #1e40af;
        background-color: #dbeafe;
    }

    .badge.history {
        color: #1f2937;
        background-color: #f3f4f6;
    }
</style>
