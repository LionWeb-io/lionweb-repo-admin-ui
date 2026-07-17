<!-- NodeNavigation.svelte -->
<script lang="ts">
	import type { NodeNavigationProps } from '$lib/components/ComponentPropsTypes';
	import { writable } from 'svelte/store';
	import type { LionWebJsonNode } from '@lionweb/json';
	import { getQualifiedNodeRepresentation, splitQualifiedName } from '$lib/utils/noderendering';

	let { chunk, selectedNodeId = null, onNodeSelect }: NodeNavigationProps = $props()
	
	const expandedLanguages = writable<Set<string>>(new Set());
	const expandedTypes = writable<Set<string>>(new Set());

	// Group nodes by language and type
	let nodesByType = $state( chunk.nodes.reduce((acc, node) => {
			const language = node.classifier?.language || 'Unknown';
			const type = node.classifier?.key || 'Unknown';
	
			if (!acc[language]) {
				acc[language] = {};
			}
			if (!acc[language][type]) {
				acc[language][type] = [];
			}
			acc[language][type].push(node);
			return acc;
		}, {} as Record<string, Record<string, LionWebJsonNode[]>>)
	);

	function handleNodeClick(nodeId: string) {
		onNodeSelect(nodeId);
	}

	function toggleLanguage(language: string) {
		expandedLanguages.update(set => {
			const newSet = new Set(set);
			if (newSet.has(language)) {
				newSet.delete(language);
			} else {
				newSet.add(language);
			}
			return newSet;
		});
	}

	function toggleType(language: string, type: string) {
		expandedTypes.update(set => {
			const key = `${language}-${type}`;
			const newSet = new Set(set);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	}
</script>

<div class="flex flex-col h-full">
	<div class="flex border-b bg-white sticky top-0 z-10 p-4">
		<h2 class="text-xl font-semibold text-gray-800">Nodes by Type</h2>
	</div>

	<div class="flex-1 overflow-y-auto bg-white">
		<div class="p-4 space-y-6">
			{#each Object.entries(nodesByType).sort(([langA], [langB]) => langA.localeCompare(langB)) as [language, types]}
				<div class="border rounded-lg ">
					<button
						class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
						onclick={() => toggleLanguage(language)}
					>
						<h3 class="font-semibold text-lg text-gray-800">{language}</h3>
						<span class="text-gray-500">
							{$expandedLanguages.has(language) ? '▼' : '▶'}
						</span>
					</button>
					{#if $expandedLanguages.has(language)}
						<div class="p-3 space-y-4">
							{#each Object.entries(types).sort(([typeA], [typeB]) => typeA.localeCompare(typeB)) as [type, nodes]}
								<div class="border-l-2 border-gray-200 pl-3">
									<button
										class="w-full flex items-center justify-between mb-2"
										onclick={() => toggleType(language, type)}
									>
										<h4 class="font-medium text-sm text-gray-600">{type}</h4>
										<span class="text-gray-500">
											{$expandedTypes.has(`${language}-${type}`) ? '▼' : '▶'}
										</span>
									</button>
									{#if $expandedTypes.has(`${language}-${type}`)}
										<div class="space-y-1">
											{#each nodes as node}
												{@const nodeInfo = getQualifiedNodeRepresentation(chunk.nodes, node)}
												<button
													class="w-full text-left px-2 py-1 rounded hover:bg-gray-100 {selectedNodeId === node.id ? 'bg-blue-50 border border-blue-200' : ''}"
													onclick={() => handleNodeClick(node.id)}
												>
													{#if nodeInfo.isId}
														<span class={'font-mono text-sm text-gray-600'}>{nodeInfo.text}</span>
													{:else}
														{@const parts = splitQualifiedName(nodeInfo.text)}
														<span class={'font-medium text-gray-500'}>{parts.prefix}</span>
														<span class={'font-medium text-gray-900'}>{parts.simpleName}</span>
													{/if}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(.highlight-node) {
		animation: highlight 2s ease-out;
	}

	@keyframes highlight {
		0% {
			background-color: rgba(59, 130, 246, 0.5);
		}
		100% {
			background-color: transparent;
		}
	}
</style>
