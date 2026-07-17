<script lang="ts">
	import type { NodeDetailsProps } from '$lib/components/ComponentPropsTypes';
	import MetaPointerUI from './MetaPointerUI.svelte';
	import { getReferenceValues, renderPropertyValue } from '$lib/utils/noderendering';

	let { node, handleNodeClick } : NodeDetailsProps = $props()
</script>

{#if node.properties?.length || node.references?.length}
	<hr class="my-2 border-t border-gray-200" />
	<div class="overflow-x-auto max-h-96">
		{#if node.properties?.length}
			<div class="mt-2">
				<div class="properties-container">
					{#each node.properties as property}
						<div class="property-row">
							<MetaPointerUI
								language={property.property.language}
								key={property.property.key}
								version={property.property.version}
							/>
							<span class="property-equals">=</span>
							<span
								class="property-value rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-gray-700 shadow-sm"
							>
                {renderPropertyValue(property)}
              </span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		{#if node.references?.length}
			<div class="mt-2">
				<div class="properties-container">
					{#each node.references as reference}
						{#if getReferenceValues(reference).length > 0}
							<div class="property-row">
								<MetaPointerUI
									language={reference.reference.language}
									key={reference.reference.key}
									version={reference.reference.version}
								/>
								<span class="reference-arrow">→</span>
								<div class="reference-targets">
									{#each getReferenceValues(reference) as target}
                    <div class="reference-target">
                      {#if target.resolveInfo}
                        <span>{target.resolveInfo}</span>
                      {/if}
											{#if target.reference}
                        <button
													class="reference-link"
													onclick={(ev) => { handleNodeClick(target.reference); ev.stopPropagation()}}
												>
                          ({target.reference})
                        </button>
                      {/if}
                    </div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.reference-target {
			margin-bottom: 0.25em;
	}

  .reference-target span {
      display: inline-block;
      margin-right: 0.25em;
  }

  .reference-target span:first-child {
      color: #333;
      font-style: italic;
  }

  .reference-link {
      color: #2563eb; /* Tailwind blue-600 */
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s ease;
  }

  .reference-link:hover {
      color: #1d4ed8; /* Tailwind blue-700 */
  }
</style>
