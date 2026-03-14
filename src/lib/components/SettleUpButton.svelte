<script lang="ts">
  let { 
    disabled = false, 
    settlements = [] as Array<{ from: string; to: string; amount: number }>,
    settlementCurrency = 'USD',
    onOpenModal
  } = $props();
</script>

<button
  onclick={onOpenModal}
  disabled={disabled || settlements.length === 0}
  class="relative px-5 py-2.5 bg-black text-white font-medium text-sm tracking-wide uppercase
         border border-[#CB8E4C]/50 rounded-lg
         hover:border-[#CB8E4C] hover:bg-neutral-950
         focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:ring-offset-2 focus:ring-offset-black
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-all duration-300 ease-out
         group/btn"
>
  <!-- Subtle gradient overlay -->
  <span class="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-[#CB8E4C]/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></span>
  
  <span class="relative flex items-center gap-2">
    <svg class="w-4 h-4 text-[#CB8E4C] group-hover/btn:text-[#CB8E4C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Settlements
    {#if settlements.length > 0}
      <span class="ml-1 px-1.5 py-0.5 bg-[#CB8E4C]/20 text-[#CB8E4C] text-xs rounded-full font-medium">
        {settlements.length}
      </span>
    {/if}
  </span>
</button>
