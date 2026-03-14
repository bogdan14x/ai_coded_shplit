<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { expoOut } from 'svelte/easing';
  
  let {
    isOpen = $bindable(),
    settlements = [] as Array<{ from: string; to: string; amount: number }>,
    settlementCurrency = 'USD',
    currencies = [] as Array<{ code: string; name: string; symbol: string }>,
    onUpdateCurrency
  } = $props();
  
  // Currency list from exchange rates (base EUR)
  const localCurrencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  ];

  let localCurrency = $state(settlementCurrency);
  
  // Only update localCurrency when modal opens or settlementCurrency changes from external source
  $effect(() => {
    if (isOpen && settlementCurrency) {
      // Reset localCurrency to match parent's settlementCurrency when modal opens
      localCurrency = settlementCurrency;
    }
  });
  
  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      isOpen = false;
    }
  }
  
  function handleCurrencyChange() {
    if (onUpdateCurrency) {
      onUpdateCurrency(localCurrency);
    }
  }
</script>

{#if isOpen}
  <!-- Fullscreen Backdrop -->
  <div 
    transition:fade={{ duration: 200, easing: expoOut }}
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    onclick={handleOverlayClick}
    onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal Container -->
    <div 
      transition:scale={{ duration: 300, easing: expoOut, start: 0.95 }}
      class="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden cursor-default"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <!-- Header with gradient accent -->
      <div class="relative px-6 py-5 bg-black border-b border-neutral-800">
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#CB8E4C]/30 to-transparent"></div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-[#CB8E4C]/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 class="text-white font-semibold tracking-wide">Settlements</h2>
              <p class="text-neutral-500 text-xs">Optimized payment flow</p>
            </div>
          </div>
          
          <button 
            onclick={() => isOpen = false}
            class="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Currency Selector -->
      <div class="px-6 py-4 bg-neutral-950/50 border-b border-neutral-800/50">
        <label for="settlement-currency" class="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">Currency</label>
        <div class="relative">
          <select
            id="settlement-currency"
            bind:value={localCurrency}
            onchange={handleCurrencyChange}
            class="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent transition-all"
          >
            {#each localCurrencies as currency}
              <option value={currency.code}>{currency.code} — {currency.name}</option>
            {/each}
          </select>
          <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Settlements List -->
      <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
        {#if settlements.length === 0}
          <div class="text-center py-8">
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-900 flex items-center justify-center">
              <svg class="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-neutral-500 text-sm">All settled up!</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each settlements as settlement, i (settlement.from + settlement.to)}
              <div 
                class="group flex items-center justify-between p-4 bg-neutral-900/50 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-all duration-300"
                style="animation-delay: {i * 50}ms"
              >
                <div class="flex items-center gap-3">
                  <!-- Avatar for payer -->
                  <div class="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-300 border border-neutral-700">
                    {settlement.from.charAt(0).toUpperCase()}
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-200 font-medium text-sm">{settlement.from}</span>
                    <svg class="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span class="text-neutral-400 font-medium text-sm">{settlement.to}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <div class="h-px w-8 bg-neutral-800 group-hover:bg-[#CB8E4C]/30 transition-colors"></div>
                  <span class="text-[#CB8E4C] font-semibold text-sm tracking-wide">
                    {settlementCurrency} {(settlement.amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Footer -->
      <div class="px-6 py-4 bg-neutral-950 border-t border-neutral-800">
        <p class="text-neutral-600 text-xs text-center">
          Settlements calculated in {settlementCurrency}
        </p>
      </div>
    </div>
  </div>
{/if}