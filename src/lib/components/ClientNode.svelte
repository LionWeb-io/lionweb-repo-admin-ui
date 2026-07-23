<script lang="ts">
	import { deltaId, setDeltaId } from '$lib/components/stores.svelte.js';
	import { isDeltaCommand, isDeltaRequest } from '@lionweb/server-delta-shared';
	import type { NodeProps } from '@xyflow/svelte';
	import type { Client } from '../../deltaclients/clients.svelte.js';
	import { ArrowUpFromLineIcon, ArrowDownToLineIcon } from '@lucide/svelte';

	let { id, data }: NodeProps = $props();
</script>

<div>
	{@render client_node(data["client"])}
</div>

{#snippet client_node(client: Client)}
	{client.id}
	<br />
	<div class="text-left">
		{#each client.messages as message}
			{@const cmd = isDeltaCommand(message) || isDeltaRequest(message) }
			<div class="flex items-center justify-left mx-4">
				{#if cmd}
					<ArrowUpFromLineIcon color="blue" />
				{:else}
					<ArrowDownToLineIcon color="green" />
				{/if}
				<!--{#if deltaId.count === client.getId(message)}-->
				<!--	<button class="btn bg-blue-100"-->
				<!--	        onclick={ () => { console.log(`set id to ${client.getId(message)}`); setDeltaId(client.getId(message))}}>-->
				<!--		{client.getId(message)} on {client.repository}: {message.messageKind} {deltaId}-->
				<!--	</button>-->
				<!--{:else}-->
				<!--	<button class="btn bg-white"-->
				<!--	        onclick={ () => { console.log(`set id to ${client.getId(message)}`); setDeltaId(client.getId(message))}}>-->
				<!--		{client.getId(message)} on {client.repository}: {message.messageKind} {deltaId}-->
				<!--	</button>-->
				<!--{/if}-->
				<button class="btn {deltaId.count === client.getId(message)? "bg-blue-100" : "bg-white"}" 
								onclick={ () => { console.log(`set id to ${client.getId(message)}`); setDeltaId(client.getId(message))}}>
					{client.getId(message)} on {client.repository}: {message.messageKind}
				</button>
			</div>
		{/each}
	</div>
{/snippet}
