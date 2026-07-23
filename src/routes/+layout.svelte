<script lang="ts">
	import '../app.css';
	import { goto } from '$app/navigation';
	import MenuBar from '$lib/components/MenuBar.svelte';
	import RepositoryPicker from '$lib/components/RepositoryPicker.svelte';
	import PartitionPicker from '$lib/components/PartitionPicker.svelte';
	import InstanceRootLink from '$lib/components/InstanceRootLink.svelte';
	import PythonPlaygroundIcon from '$lib/components/PythonPlaygroundIcon.svelte';
	import { page } from '$app/state';
	import { ChevronRightIcon, ChevronsRightIcon } from "@lucide/svelte"
	import { AppBar } from '@skeletonlabs/skeleton-svelte';

	let { children } = $props();
	
	let isLargePage = $state(Boolean(page.params.repository && page.params.id) || page.url.pathname === '/playground');

	const navbarMenu = [
		{
			label: "Repositories",
			action: () => {
				goto("/repositories");
			}
		},
		{
			label: "Server",
			action: async () => {
				await goto("/server")
			}
		},
		{
			label: "Diagram",
			action: async () => {
				await goto("/diagram")
			}
		},
		{
			label: "TimeTable",
			action: async () => {
				await goto("/timetable")
			}
		}
	]
</script>


<div class="min-h-screen ">
	
	<nav class="bg-white shadow-lg top-0 z-30 header">

		<MenuBar menu={navbarMenu}/>
		<div class="mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<a href="/repositories" class="flex items-center space-x-4">
					<img src="/images/lionweb-logo.png" alt="LionWeb Logo" class="h-18 w-auto transition-transform hover:scale-105" />
					<div>
						<h1 class="text-3xl font-bold text-gray-800 headline">LionWeb Repository Admin Panel</h1>
						<p class="text-sm text-gray-500">at http://localhost:3005</p>
					</div>
				</a>
			</div>


			<div class="mt-6 flex items-center justify-between">
				<div class="breadcrumbs flex items-center space-x-2 p-2">
					<div class="step root">
						<InstanceRootLink/>
					</div>
					<div class="chevron text-gray-400">
						<ChevronRightIcon/>
					</div>
					{#if page.params.repository}
						<div class="step repository">
							Repo picker
							<RepositoryPicker/>
						</div>
						{#if page.params.id}
							<div class="chevron text-gray-400">
								<ChevronRightIcon/>
							</div>
							<div class="step partition">
								Partition picker
								<PartitionPicker/>
							</div>
						{/if}
					{/if}
				</div>
				<PythonPlaygroundIcon />
			</div>
		</div>
	</nav>

	<main class={isLargePage ? 'w-full px-2 bg-amber-200' : 'py-6 sm:px-6 lg:px-8 bg-blue-200'}>
		<div class={isLargePage ? 'max-w-screen-3xl mx-auto' : 'mx-auto max-w-7xl px-4 py-6 sm:px-0'}>
			{@render children?.()}
		</div>
	</main>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Playfair+Display:wght@500;700&display=swap');

  :root {
      --header-height: 13.5em;
  }

	.header {
      width: 100%;
      height: var(--header-height);
      position: absolute;
	}

	main {
			position: absolute;
			top: var(--header-height);
      width: 100%;
			height: calc(100% - var(--header-height));
			overflow-y: scroll;
	}

	.headline {
		font-family: 'Inter', sans-serif;
	}

	.step {
		display: inline-flex;
		align-items: center;
		height: 48px;
		padding: 0 1rem;
		background-color: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.step:hover {
		border-color: #3b82f6;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.step.root {
		background-color: #f3f4f6;
	}

	.chevron {
		display: flex;
		align-items: center;
		height: 48px;
	}
</style>
