<script lang="ts">
    import type { LionWebJsonChunk } from '@lionweb/repository-client';
    import type { LionWebJsonMetaPointer } from '@lionweb/validation';
    import { page } from '$app/stores';
    import { loadPartition, deletePartition, createPartition } from '$lib/services/repository';
    import { createEventDispatcher } from 'svelte';

    export let partition: { id: string; name?: string; isLoaded?: boolean; data?: LionWebJsonChunk; metapointer?: LionWebJsonMetaPointer };
    export let onClick: (partition: { id: string }) => void;

    const dispatch = createEventDispatcher();

    let showDeleteConfirm = false;
    let loading = false;
    let error: string | null = null;
    let isDragging = false;

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
    }

    async function handleDownload() {
        try {
            loading = true;
            error = null;

            const partitionData = await loadPartition($page.params.repository, partition.id);
            const blob = new Blob([JSON.stringify(partitionData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${partition.id}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            error = `Failed to download partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
            console.error('Error details:', e);
        } finally {
            loading = false;
        }
    }

    async function handleDelete() {
        try {
            loading = true;
            error = null;

            await deletePartition($page.params.repository, partition.id);
            showDeleteConfirm = false;
            dispatch('deleted');
        } catch (e) {
            error = `Failed to delete partition: ${e instanceof Error ? e.message : 'Unknown error'}`;
            console.error('Error details:', e);
        } finally {
            loading = false;
        }
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;

        if (!event.dataTransfer) return;

        const files = Array.from(event.dataTransfer.files);
        if (files.length === 0) return;

        try {
            loading = true;
            error = null;

            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    const content = await file.text();
                    const partitionData: LionWebJsonChunk = JSON.parse(content);
                    await createPartition($page.params.repository, partitionData);
                }
            }

            dispatch('partitionsCreated');
        } catch (e) {
            error = `Failed to create partitions: ${e instanceof Error ? e.message : 'Unknown error'}`;
            console.error('Error details:', e);
        } finally {
            loading = false;
        }
    }
</script>

<div 
    class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow duration-200"
>
    <div class="px-6 py-4">
        <div class="flex flex-col">
            <div class="min-w-0">
                {#if partition.name}
                    <h3 class="text-lg font-semibold text-gray-900">{partition.name}</h3>												
                {/if}
                <p class="text-xs text-gray-500 uppercase tracking-wide break-all max-w-[200px]">{partition.id}</p>
                {#if partition.metapointer}
                    <span class="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {partition.metapointer.language}:{partition.metapointer.version}:{partition.metapointer.key}
                    </span>
                {/if}
            </div>
            <div class="flex justify-end mt-4 gap-2">
                <button
                    on:click|stopPropagation={() => onClick(partition)}
                    class="inline-flex items-center rounded-full border border-transparent p-2 text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                    title="View Partition"
                >
                    <svg
                        class="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="sr-only">View</span>
                </button>
                <button
                    on:click|stopPropagation={handleDownload}
                    class="inline-flex items-center rounded-full border border-transparent p-2 text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    title="Download Partition"
                >
                    <svg
                        class="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="sr-only">Download</span>
                </button>
                <button
                    on:click|stopPropagation={() => showDeleteConfirm = true}
                    class="inline-flex items-center rounded-full border border-transparent p-2 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                    title="Delete Partition"
                >
                    <svg
                        class="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="sr-only">Delete</span>
                </button>
            </div>
        </div>
    </div>
</div>

{#if showDeleteConfirm}
    <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <div class="fixed inset-0 z-60 flex items-center justify-center px-4 text-center">
            <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div
                class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
                <div class="sm:flex sm:items-start">
                    <div
                        class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
                    >
                        <svg
                            class="h-6 w-6 text-red-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Delete Partition
                        </h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500">
                                Are you sure you want to delete the partition "{partition.name || partition.id}"? This action cannot be
                                undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        on:click={handleDelete}
                        class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        on:click={() => showDeleteConfirm = false}
                        class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if} 