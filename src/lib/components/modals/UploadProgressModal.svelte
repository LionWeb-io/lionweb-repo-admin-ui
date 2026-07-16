<script lang="ts">
	import type { UploadProgressProps } from '$lib/components/modals/ModalProps';

	let { show, progress }: UploadProgressProps = $props()
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
			aria-hidden="true"
		></div>
		<div class="fixed inset-0 z-60 flex items-center justify-center px-4 text-center">
			<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
			>
				<div>
					<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
						Importing Partitions
					</h3>
					<div class="mt-4">
						<div class="mb-4">
							<div class="relative pt-1">
								<div class="flex mb-2 items-center justify-between">
									<div>
										<span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
											Progress
										</span>
									</div>
									<div class="text-right">
										<span class="text-xs font-semibold inline-block text-indigo-600">
											{progress.current} / {progress.total} partitions
										</span>
									</div>
								</div>
								<div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
									<div
										style="width: {(progress.current / Math.max(1, progress.total)) * 100}%"
										class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
									></div>
								</div>
							</div>
						</div>
						<p class="text-sm text-gray-500">
							Please wait while we import the partitions...
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if} 
