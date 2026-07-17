<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { loadPartition } from '$lib/services/repository';
	import NodeTree from '$lib/components/NodeTree.svelte';
	import LanguageUI from '$lib/components/LanguageUI.svelte';
	import type { LionWebJsonChunk } from '@lionweb/server-client';
	import NodeNavigation from '$lib/components/NodeNavigation.svelte';
	import { tick } from 'svelte';
  import { SvelteSet } from "svelte/reactivity"
	
	let repositoryName = $state(page.params.repository);
	let nodeId = $state(page.params.id);
	let loading = $state(false);
	let error: string | null = $state(null);
	let expandedNodes = $state(new SvelteSet<string>());
	let partitionData: LionWebJsonChunk | null = $state(null);
	let selectedNodeId: string | null = $state(null);

		loadData();

	async function loadData() {
		try {
			loading = true;
			error = null;
			console.log('Loading partition', repositoryName, nodeId);
			partitionData = await loadPartition(repositoryName!!, nodeId!!);
			console.log('Got partition data', partitionData);

		} catch (e) {
			error = `Failed to load partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
			console.error('Error details:', e);
		} finally {
			loading = false;
		}
	}

	function handleNodeClick(nodeId: string) {
		handleNodeSelect(nodeId);
	}

	function handleExpandAll() {
		if (!partitionData) return;
		partitionData.nodes.forEach(node => {
			expandedNodes.add(node.id);
		});
	}

	function handleCollapseAll() {
		expandedNodes.clear();
	}

	async function handleNodeSelect(nodeId: string) {
		selectedNodeId = nodeId;
		if (!partitionData) return;

		// Find the node and expand all its ancestors
		let currentNode = partitionData.nodes.find((n) => n.id === nodeId);
		const ancestors = [];
		while (currentNode?.parent) {
			ancestors.push(currentNode.parent);
			currentNode = partitionData.nodes.find((n) => n.id === currentNode?.parent);
		}

		// Expand all ancestors in reverse order (from root to parent)
		ancestors.reverse().forEach(ancestorId => {
			expandedNodes.add(ancestorId);
		});

		// Wait for the DOM to update
		await tick();

		// Find the element and scroll to it
		const element = document.getElementById(`node-${nodeId}`);
		if (element) {
			// Add highlight animation
			element.classList.add('highlight-node');
			setTimeout(() => element.classList.remove('highlight-node'), 2000);

			// Simple scroll into view
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		}
	}

	onMount(loadData);
</script>

<div class="flex min-h-screen bg-white">
	<!-- Fixed Left Panel -->
	<div class="w-120 h-screen fixed top-0 left-0 border-r border-gray-200 bg-gray-50 p-4" style="padding-top: var(--header-height)">
		{#if partitionData}
			<NodeNavigation
				chunk={partitionData}
				onNodeSelect={handleNodeSelect}
				selectedNodeId={selectedNodeId}
			/>
		{:else}
			<p>Loading...</p>
		{/if}
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 ml-120 flex flex-col">
	<!-- Header -->
	<div class="border-b border-gray-200 px-6 py-4">
		<div class="flex items-center justify-end">
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onclick={handleExpandAll}
					title="Expand All"
				>
					<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
					Expand All
				</button>
				<button
					type="button"
					class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onclick={handleCollapseAll}
					title="Collapse All"
				>
					<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
					</svg>
					Collapse All
				</button>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="px-6 py-4">
		{#if loading}
			<div class="py-12 text-center">
				<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
			</div>
		{:else if error}
			<div class="py-12 text-center">
				<p class="text-red-600">{error}</p>
			</div>
		{:else if partitionData}
			<div class="space-y-6">
				{#if partitionData.languages.length > 0}
					<div>
						<h4 class="text-sm font-medium text-gray-700 mb-2">Languages</h4>
						<div class="flex flex-wrap gap-2">
							{#each partitionData.languages as language}
								<LanguageUI language={language.key} version={language.version} />
							{/each}
						</div>
					</div>
				{/if}

				<div>
					<h4 class="text-sm font-medium text-gray-700 mb-2">Nodes</h4>
					<div class="bg-gray-50 rounded-lg p-4 max-h-[calc(100vh-300px)] overflow-y-auto" id="node-tree-container">
						<NodeTree
							chunk={partitionData}
							expandedNodes={expandedNodes}
							nodeClick={handleNodeClick}
							selectedNodeId={selectedNodeId}
						/>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
</div>

<style>
	@keyframes highlight {
		0% {
			background-color: #fef3c7;
		}
		100% {
			background-color: inherit;
		}
	}

	:global(.highlight-node) {
		animation: highlight 2s ease-out;
	}
</style>
