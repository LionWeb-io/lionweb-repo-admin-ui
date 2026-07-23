<script lang="ts">
	
	import { clients } from '../../deltaclients/clients.svelte.js';
	import { Monitor } from '../../deltaclients/monitor.svelte.js';

	let cols = 3
	console.log("Time Table")
	
	const monitor = Monitor.getInstance()
</script>

<table>
	<thead>
		<tr>
			{#each clients as client}
				<th>ID {client.id}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
	{#each clients as client}
		{#each client.messages as msg}
			<tr>
				<td>{client.id}-{msg.messageKind}</td>
			</tr>
		{/each}
	{/each}
	</tbody>
</table>
<style>


</style>
