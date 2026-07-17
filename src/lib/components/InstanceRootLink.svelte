<script>
  import { GlobeAlt } from 'svelte-heros';
  import { goto } from '$app/navigation';

  function handleClick() {
    goto('/repositories');
  }
</script>

<button class="bg-transparent border-0 p-0" onclick={handleClick}>
  <GlobeAlt class="icon cursor-pointer hover:text-indigo-600" />
</button>

<style>

</style>
