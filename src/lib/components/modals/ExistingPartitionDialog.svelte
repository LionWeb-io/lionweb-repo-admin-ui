<script lang="ts">
	import type { ExistingPartitionProps } from '$lib/components/modals/ModalProps';

	let { show, partitionId, onAction}: ExistingPartitionProps = $props()

	let applyToAll = false;
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
		>
			<div
				class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
				aria-hidden="true"
			></div>
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
				>&#8203;</span
			>
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
			>
				<div>
					<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
						<svg class="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div class="mt-3 text-center sm:mt-5">
						<h3 class="text-lg leading-6 font-medium text-gray-900">
							Partition Already Exists
						</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">
								The partition "{partitionId}" already exists in the repository. 
								Would you like to skip it or replace it?
							</p>
						</div>
					</div>
				</div>
				<div class="mt-5 sm:mt-6">
					<div class="flex flex-col space-y-4">
						<div class="flex items-center">
							<input
								type="checkbox"
								id="applyToAll"
								bind:checked={applyToAll}
								class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<label for="applyToAll" class="ml-2 block text-sm text-gray-900">
								Apply this choice to all remaining partitions
							</label>
						</div>
						<div class="flex justify-end space-x-3">
							<button
								type="button"
								on:click={() => onAction('skip', applyToAll)}
								class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
							>
								Skip
							</button>
							<button
								type="button"
								on:click={() => onAction('replace', applyToAll)}
								class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
							>
								Replace
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if} 
