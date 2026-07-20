<script lang="ts">
	import MenuBar from '$lib/components/MenuBar.svelte';
	import { DeltaClient } from '@lionweb/server-delta-client';
  import Diagram  from "$lib/components/Diagram.svelte"
	import { Monitor } from '../../deltaclients/monitor.svelte.js';

	const monitor = Monitor.getInstance()	
	const clients: DeltaClient[] = $state([])
	
	const diagramMenu = [
		{
			label: "Create Client",
			action: () => {
				console.log("clicked");
			}
		}
	]
</script>

<MenuBar menu={diagramMenu}/>
<div class="flex h-[calc(100vh-var(--header-height))] max-w-fullbg-white">
	<Diagram/>
</div>

<style>

</style>
