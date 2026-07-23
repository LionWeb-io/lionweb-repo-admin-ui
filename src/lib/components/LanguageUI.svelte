<script lang="ts">
	import type { LanguageUIProps } from '$lib/components/ComponentPropsTypes.js';

	let { language, version }: LanguageUIProps = $props()
</script>

<div
	class="inline-flex items-center   px-2.5 py-0.5 text-xs font-medium text-blue-800"
>
	<span class="language">{language}</span>
	<span class="version">{version}</span>
</div>

<style>
	.version {
		padding-left: 0.4rem;
	}
</style>
