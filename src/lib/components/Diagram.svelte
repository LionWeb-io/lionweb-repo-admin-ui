<script lang="ts">
	import ClientNode from '$lib/components/ClientNode.svelte';
	import {
		SvelteFlow,
		Controls,
		MiniMap,
		Panel,
		Position,
		type Node,
		type Edge,
		Background,
	} from '@xyflow/svelte';
	import './index.css';
	import { clients } from '../../deltaclients/clients.svelte.js';
	
	let edges: Edge[] = []
	let nodes = $derived(clients.map((c, i) => { return {
			id: c.id,
			type: 'clientNode',
			data: { client: c },
		position: { x: 200*i, y: 50*i },
		sourcePosition: Position.Right
	}}))
	
	const nodeTypes = {
		clientNode: ClientNode,
	};
	
</script>

<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView colorMode="system">
	<Background />
	<Controls />
	<MiniMap />
</SvelteFlow>

<style>
    .color-panel {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--xy-controls-button-border-color, #ddd);
        border-radius: 8px;
        background: var(--xy-controls-button-background-color, #fff);
    }

    .color-swatch {
        width: 16px;
        height: 16px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 999px;
    }

    .color-value {
        font-family: monospace;
        font-variant-numeric: tabular-nums;
    }
</style>
