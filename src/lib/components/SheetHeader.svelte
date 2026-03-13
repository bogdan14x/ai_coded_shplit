<script lang="ts">
  let { title, description } = $props();
</script>

<header class="sheet-header mb-6 slide-up">
  <h1 class="text-3xl font-display font-bold tracking-tight text-white">{title}</h1>
  {#if description}
    <p class="text-neutral-400 mt-2 text-lg">{description}</p>
  {/if}
</header>
