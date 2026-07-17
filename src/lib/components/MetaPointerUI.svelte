<script lang="ts">
	import type { MetaPointerUIProps } from '$lib/components/ComponentPropsTypes';
	import LanguageUI from '$lib/components/LanguageUI.svelte';

	let { language, key, version }: MetaPointerUIProps = $props()
</script>

<div class="meta-pointer ">
	<details name="exclusive" class="text-nowrap rounded-full bg-blue-100" ontoggle={(ev) => {ev.preventDefault(); ev.stopPropagation()}}>
		<summary ontoggle={(ev) => { ev.preventDefault(); ev.stopPropagation()}}>
			<span class="key text-xs font-medium text-blue-800">{key}</span>
		</summary>
		<LanguageUI {language} {version} />
	</details>
</div>

<style>
	.meta-pointer {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.key {
			overflow: hidden;
		padding: 0.05rem 0.25rem;
	}
  details {
      overflow: hidden;
  }

  /*details:first-of-type {*/
  /*    !*border-top: solid #ADADAD 2px;*!*/
  /*}*/

  details[open] {
      border: solid #ADADAD 2px;
			border-radius: 8px;
  }

  summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.15rem 0.35rem 0.15rem 0.15rem;
      font-weight: bold;
      font-size: 20px;
      cursor: pointer;
  }

  summary::after {
			content: '';
      border: solid #0000CD;
      border-width: 0 3px 3px 0;
      display: inline-block;
      padding: 4px;
      transition: 0.3s;
      transform: rotate(45deg);
  }

  details[open] > summary::after {
      transform: rotate(-135deg);
  }

  summary::-webkit-details-marker {
      display: none;
  }

	
</style>
