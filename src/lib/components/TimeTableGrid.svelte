<script lang="ts">

	import { clients } from '../../deltaclients/clients.svelte.js';
	import { isFromClient, mmId, Monitor, type MonitorMessage } from '../../deltaclients/monitor.svelte.js';

	console.log("Time Table Grid")

	const monitor = Monitor.getInstance()
	
	function a(m: MonitorMessage): boolean {
		
		console.log(`RENDER ${m.delta.messageKind} row ${monitor.messageToRow.get(mmId(m))} id is ${mmId(m)}`)
		return isFromClient(m.delta)
	}
</script>


<div>
	{monitor.messageToRow.entries().forEach(e => console.log(JSON.stringify(e)))}
</div>
<div class="grid container gap-3 rounded-lg bg-gray-100 p-4" >
	{#each monitor.activeClients.entries() as client}
		<div class="rounded bg-yellow-200 p-1"
		     style:grid-row={1}
		     style:grid-column={monitor.clientToColum.get(client[0])}
		>
			{client[0]}
		</div>
	{/each}
	{#each monitor.allMessages as message}
		{@const commandOrRequest = a(message)}
			{@const row = monitor.messageToRow.get(mmId(message))}
			{@const color = isFromClient(message.delta) ? "lightblue" : "lightgreen"}
			<div class="rounded bg-green-200 p-1"
					 style:background-color="{color}"
			     style:grid-row={row}
			     style:grid-column={monitor.clientToColum.get(message.clientId)}
			>
				{message.delta.messageKind}
			</div>
	{/each}

</div>


<style>
    .container {
				width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				grid-auto-flow: row;
        gap: 4px;
    }
</style>
