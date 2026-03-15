<script lang="ts">
  let { title, description, onCopyInvite } = $props();
  let copySuccess = $state(false);

  function handleCopy() {
    onCopyInvite?.();
    copySuccess = true;
    setTimeout(() => {
      copySuccess = false;
    }, 2000);
  }
</script>

<header class="sheet-header mb-6 slide-up">
  <div class="flex flex-col items-center gap-3">
    <!-- Copy Invite Link Button - Pill shape with border, centered above title -->
    <button
      onclick={handleCopy}
      class="px-4 py-2 border-2 border-[#CB8E4C] text-[#CB8E4C] hover:bg-[#CB8E4C] hover:text-white text-xs font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
    >
      {#if copySuccess}
        <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Copied!
      {:else}
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        <span>Copy Invite Link</span>
      {/if}
    </button>
    
    <div class="flex items-baseline gap-3">
      <h1 class="text-3xl font-display font-bold tracking-tight text-white">{title}</h1>
    </div>
    {#if description}
      <p class="text-neutral-400 mt-2 text-lg">{description}</p>
    {/if}
  </div>
</header>
