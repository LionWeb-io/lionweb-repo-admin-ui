<script lang="ts">
	import Self  from "$lib/components/NodeTree.svelte"
	import type { NodeTreeProps } from '$lib/components/ComponentPropsTypes.js';
	import type {	SerializedContainment, MetaPointer } from '@lionweb/core';
	import MetaPointerUI from '$lib/components/MetaPointerUI.svelte';
	import NodeDetails from '$lib/components/NodeDetails.svelte';
	import type { LionWebJsonNode } from '@lionweb/json';

	let {
		chunk,
		expandedNodes,
		level = 0,
		nodeId = null,
		selectedNodeId = null,
		nodeClick = (id: string) => {}
	}: NodeTreeProps = $props()
	
	let allContainments = chunk.nodes
		.map((container: LionWebJsonNode) => container.containments)
		.flat();
	let allAnnotationIds = new Set(chunk.nodes
		.map((container: LionWebJsonNode) => container.annotations)
		.flat());

	function getRole(nodeId: string): MetaPointer | undefined {
		return allContainments.find((containment: SerializedContainment) =>
			containment.children.includes(nodeId)
		)?.containment;
	}

	let allRoles = new Map<string, MetaPointer | undefined>();
	chunk.nodes.forEach((node: LionWebJsonNode) => {
		allRoles.set(node.id, getRole(node.id));
	});

	function toggleNode(id: string) {
		if (expandedNodes.has(id)) {
			expandedNodes.delete(id);
		} else {
			expandedNodes.add(id);
		}
	}

	function getChildNodes(id: string): LionWebJsonNode[] {
		if (!chunk?.nodes) return [];
		const children = chunk.nodes.filter((node) => node.parent === id);
		return children.sort((a, b) => Number(!isAnnotation(a)) - Number(!isAnnotation(b)));
	}

	function getAnnotationsOn(id: string): string[] {
		if (!chunk?.nodes) return [];
		const thisNode = chunk.nodes.find((node) => node.id === id)!!;
		return thisNode.annotations;
	}

	function hasChildren(node: LionWebJsonNode): boolean {
		return getChildNodes(node.id).length > 0;
	}

	function hasAnnotations(node: LionWebJsonNode): boolean {
		return getAnnotationsOn(node.id).length > 0;
	}

	function getNodeColor(id: string): string {
		// Generate a consistent hash from the node ID
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Convert hash to HSL color with high lightness for pastel colors
		const hue = Math.abs(hash % 360);
		return `hsl(${hue}, 70%, 95%)`;
	}

	function handleNodeClick(id: string) {
		nodeClick(id)
	}

	function isFirstNodeInContainment(node: LionWebJsonNode): boolean {
		const role = allRoles.get(node.id);
		if (!role) return false;

		// Get all nodes with the same containment
		const nodesInSameContainment = chunk.nodes.filter(
			(n) =>
				allRoles.get(n.id)?.key === role.key &&
				allRoles.get(n.id)?.language === role.language &&
				allRoles.get(n.id)?.version === role.version &&
				n.parent === node.parent
		);

		// Return true if this is the first node
		return nodesInSameContainment[0]?.id === node.id;
	}

	function isAnnotation(node: LionWebJsonNode): boolean {
		return allAnnotationIds.has(node.id);
	}

	function isFirstAnnotation(node: LionWebJsonNode): boolean {
		if (!allAnnotationIds.has(node.id)) {
			return false;
		}

		// Get all nodes with the same containment
		const siblingAnnotations = chunk.nodes.find(
			(n) =>
				n.id == node.parent
		)?.annotations;

		return siblingAnnotations?.at(0) === node.id;
	}

	let nodes: LionWebJsonNode[] = $derived(
		nodeId === null
			? chunk?.nodes?.filter((node) => !node.parent) || [] // Root nodes
			: getChildNodes(nodeId)
	);
</script>

<div class="space-y-2 overflow-y-auto">
	{#each nodes as node}
		<div
			class="rounded p-2 {selectedNodeId === node.id ? 'highlight-node' : ''}"
			style="margin-left: {level * 20}px; /*background-color: {getNodeColor(node.id)}*/"
			id="node-{node.id}"
		>
			<div class="flex flex-col space-y-2">
				{#if allRoles.get(node.id) != null && isFirstNodeInContainment(node)}
					<div class="containment-role">
						<MetaPointerUI
							language={allRoles.get(node.id)?.language || 'Unknown'}
							key={allRoles.get(node.id)?.key || 'Unknown'}
							version={allRoles.get(node.id)?.version || 'Unknown'}
						/>
					</div>
				{:else if isFirstAnnotation(node)}
					<div class="text-sm font-semibold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-2">
						Annotations
					</div>
				{/if}
				<div class="flex items-start space-x-2">
					{#if hasChildren(node) || hasAnnotations(node)}
						<button
							class="mt-1 text-gray-500 hover:text-gray-700"
							onclick={() => toggleNode(node.id)}
						>
							{expandedNodes.has(node.id) ? '▼' : '▶'}
						</button>
					{:else}
						<span class="w-4"></span>
					{/if}
					{#if isAnnotation(node)}
						<div class="flex-grow rounded border-l-4 border-yellow-400 bg-yellow-100 bg-opacity-20 p-2 max-w-2xl shadow-sm rounded-r">
							<div class="flex items-center justify-between mb-1">
								<p class="font-medium text-yellow-800 text-sm break-all min-w-0">
									📝 {node.id || 'Unknown'}
								</p>
								<div class="classifier flex-shrink-0">
									<MetaPointerUI
										language={node.classifier.language}
										key={node.classifier.key}
										version={node.classifier.version}
									/>
								</div>
							</div>

							<NodeDetails {node} {handleNodeClick} />
						</div>
					{:else}
						<!-- svelte-ignore <a11y_click_events_have_key_events> -->
						<!-- svelte-ignore <a11y_no_noninteractive_element_interactions> -->
						<!-- svelte-ignore <a11y_no_static_element_interactions> -->
						<div class="flex-grow rounded border p-2 max-w-2xl {selectedNodeId === node.id ? 'selected-node' : ''} node-panel-selectable"
								 style="background-color: white" onclick={() => handleNodeClick(node.id)}>
							<div class="node-header">
								<p class="font-medium break-all min-w-0 node-id">🔹 {node.id || 'Unknown'}</p>
								<div class="classifier flex-shrink-0">
									<MetaPointerUI
										language={node.classifier.language}
										key={node.classifier.key}
										version={node.classifier.version}
									/>
								</div>
							</div>
							<NodeDetails {node} {handleNodeClick} />
						</div>
					{/if}
				</div>
			</div>
			{#if expandedNodes.has(node.id)}
				<Self {chunk} {expandedNodes} nodeId={node.id} level={level + 1} {nodeClick} {selectedNodeId} />
			{/if}
		</div>
	{/each}
</div>

<style>
	.highlight-node {
		animation: highlight 2s ease-out;
	}

	@keyframes highlight {
		0% {
			background-color: #fef3c7;
		}
		100% {
			background-color: inherit;
		}
	}

	.selected-node {
		border: 2px solid #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.node-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.node-header p {
		margin: 0;
	}

	.classifier {
		flex-shrink: 0;
	}

	.containment-role {
		margin-left: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.node-panel-selectable {
		cursor: pointer;
	}

	.node-id {
			min-width: 30%;
	}
</style>
