<script lang="ts">
	import type { MenuBarProps } from '$lib/components/MenuBarTypes.js';

	const { menu }: MenuBarProps = $props()
	
</script>

<div class="sticky p-2 bg-amber-100">
	<div class="flex items-center space-x-4 p-0">
		{#each menu as menuItem (menuItem.label)}
			<button on:click={menuItem.action}>{menuItem.label}</button>
		{/each}
	</div>
</div>
