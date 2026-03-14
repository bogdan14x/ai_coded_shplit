<script lang="ts">
  import { slide } from 'svelte/transition';
  
  let { 
    disabled = false, 
    settlements = [] as Array<{ from: string; to: string; amount: number }>,
    settlementCurrency = 'USD'
  } = $props();
  
  let isExpanded = $state(false);
</script>

<div class="w-full">
  <button
    onclick={() => isExpanded = !isExpanded}
    disabled={disabled || settlements.length === 0}
    class="w-full py-4 px-6 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
  >
    <span class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {isExpanded ? 'Hide Settlements' : 'Show Settlements'}
      {#if settlements.length > 0}
        <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs">
          {settlements.length}
        </span>
      {/if}
    </span>
  </button>

  {#if isExpanded && settlements.length > 0}
    <div transition:slide={{ duration: 200 }} class="mt-4 bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <h3 class="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Settlements ({settlementCurrency})
      </h3>
      <div class="space-y-2">
        {#each settlements as settlement (settlement.from + settlement.to)}
          <div class="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-neutral-300 font-medium">{settlement.from}</span>
              <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span class="text-neutral-300 font-medium">{settlement.to}</span>
            </div>
            <span class="text-[#CB8E4C] font-semibold">
              {settlementCurrency} {(settlement.amount / 100).toFixed(2)}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
