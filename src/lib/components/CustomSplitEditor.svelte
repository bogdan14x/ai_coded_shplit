<script lang="ts">
  import { onMount } from 'svelte';
  import { normalizeAllocations, roundToFiveCents } from '$lib/utils/splitLogic';
  import type { SplitData, Participant } from '$lib/utils/splitLogic';

  // Types (re-exported from splitLogic)

  // Props
  let {
    totalAmount = $bindable('0.00'),
    participants = [] as Participant[],
    initialSplitData = {} as SplitData,
    onUpdate
  }: {
    totalAmount: string;
    participants: Participant[];
    initialSplitData: SplitData;
    onUpdate: (data: SplitData) => void;
  } = $props();

  // State
  let selectedIds = $state(new Set<number>());
  let allocations = $state<Record<number, number>>({});
  let lastModifiedId = $state<number | null>(null);
  // Track which participants have been manually adjusted by the user
  let manuallyAdjusted = $state<Set<number>>(new Set());

  // Parse total amount
  const totalParsed = $derived(parseFloat(totalAmount) || 0);

  // Initialize from props
  onMount(() => {
    // Initialize selected IDs based on initialSplitData
    const ids = Object.keys(initialSplitData).map(id => parseInt(id));
    selectedIds = new Set(ids);

    // Initialize allocations
    const allocs: Record<number, number> = {};
    ids.forEach(id => {
      allocs[id] = parseFloat(initialSplitData[id]) || 0;
    });
    allocations = allocs;
  });

  // Toggle participant selection
  function toggleSelection(id: number) {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
      delete allocations[id];
      // Remove from manually adjusted if it was there
      const newManuallyAdjusted = new Set(manuallyAdjusted);
      newManuallyAdjusted.delete(id);
      manuallyAdjusted = newManuallyAdjusted;
      lastModifiedId = null;
    } else {
      newSelectedIds.add(id);
      // Initialize with 0 or distribute remaining
      allocations[id] = 0;
      // We need to update selectedIds before calling normalizeAllocs
      selectedIds = newSelectedIds;
      normalizeAllocs(id); // Distribute remaining to new participant
      triggerUpdate();
      return;
    }
    selectedIds = newSelectedIds;
    triggerUpdate();
  }

  // Normalize allocations so they sum to totalParsed
  // If a specific ID is provided (the one being modified), we adjust others to compensate
  function normalizeAllocs(changedId?: number) {
    allocations = normalizeAllocations(allocations, selectedIds, totalParsed, changedId, manuallyAdjusted);
  }

  function onAmountChange(id: number, eventOrValue: Event | string) {
    let val: number;
    
    if (typeof eventOrValue === 'string') {
      // Direct value passed (from stepper buttons)
      val = parseFloat(eventOrValue);
    } else {
      // Event passed (from text input)
      const target = eventOrValue.target as HTMLInputElement;
      val = parseFloat(target.value);
    }
    
    if (isNaN(val) || val < 0) val = 0;
    // Already rounded from stepper, but text input might not be
    val = roundToFiveCents(val);

    // Mark this participant as manually adjusted
    const newManuallyAdjusted = new Set(manuallyAdjusted);
    newManuallyAdjusted.add(id);
    manuallyAdjusted = newManuallyAdjusted;

    allocations[id] = val;
    lastModifiedId = id;

    // Auto-normalize others to maintain total (only adjusting unadjusted participants)
    normalizeAllocs(id);
    triggerUpdate();
  }





  function selectAll() {
    const newSelectedIds = new Set(selectedIds);
    participants.forEach(p => {
      if (!newSelectedIds.has(p.id)) {
        newSelectedIds.add(p.id);
        allocations[p.id] = 0;
      }
    });
    selectedIds = newSelectedIds;
    normalizeAllocs();
    triggerUpdate();
  }

  function deselectAll() {
    selectedIds = new Set();
    allocations = {};
    triggerUpdate();
  }

  function triggerUpdate() {
    // Don't update if over-allocated (remainder is negative)
    if (isOverAllocated) {
      return;
    }
    
    const result: SplitData = {};
    selectedIds.forEach(id => {
      result[id] = allocations[id].toFixed(2);
    });
    onUpdate(result);
  }

  // Computed values for UI
  const allocatedSum = $derived(Object.values(allocations).reduce((a, b) => a + b, 0));
  const remaining = $derived(totalParsed - allocatedSum);
  const isBalanced = $derived(Math.abs(remaining) < 0.001);
  const isOverAllocated = $derived(remaining < -0.001);
</script>

<div class="space-y-6">
  <!-- Header: Total & Balance -->
  <div class="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
    <div>
      <div class="text-xs text-neutral-400 uppercase tracking-wider mb-1">Total Expense</div>
      <div class="text-2xl font-bold text-white">
        {totalAmount} <span class="text-sm font-normal text-neutral-400">USD</span>
      </div>
    </div>
    <div class="text-right">
      <div class="text-xs text-neutral-400 uppercase tracking-wider mb-1">Remaining</div>
      <div class="text-lg font-mono {isOverAllocated ? 'text-red-400' : isBalanced ? 'text-green-400' : 'text-yellow-400'}">
        {remaining.toFixed(2)}
      </div>
    </div>
  </div>

  <!-- Participant Selection -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-neutral-300">Participants</span>
      <div class="flex gap-2">
        <button onclick={deselectAll} class="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          None
        </button>
        <button onclick={selectAll} class="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          All
        </button>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each participants as participant (participant.id)}
        <button
          type="button"
          onclick={() => toggleSelection(participant.id)}
          class="flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 {selectedIds.has(participant.id)
            ? 'border-[#CB8E4C] bg-[#CB8E4C]/15 text-white shadow-lg shadow-[#CB8E4C]/5'
            : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600'}"
        >
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs {selectedIds.has(participant.id) ? 'bg-[#CB8E4C] text-white' : 'bg-neutral-700'}">
            {selectedIds.has(participant.id) ? '✓' : participant.name.charAt(0).toUpperCase()}
          </div>
          <span class="text-sm">{participant.name}</span>
        </button>
      {/each}
    </div>
  </div>

      <!-- Allocation Editor -->
      {#if selectedIds.size > 0}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-300">Allocation</span>
            {#if isOverAllocated}
              <div class="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>Over by {Math.abs(remaining).toFixed(2)}</span>
              </div>
            {/if}
          </div>

      <div class="space-y-3">
        {#each participants as participant (participant.id)}
          {#if selectedIds.has(participant.id)}
            <div class="flex items-center gap-3 group">
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 flex-shrink-0">
                {participant.name.charAt(0).toUpperCase()}
              </div>

              <!-- Stepper Input Area -->
              <div class="flex-1 flex items-center gap-2">
                <!-- Name Label (visible on larger screens) -->
                <span class="text-sm text-neutral-300 w-16 hidden sm:block">{participant.name}</span>
                
                <!-- Stepper Buttons & Input -->
                <div class="flex items-center flex-1">
                  <!-- Decrease Button -->
                  <button
                    type="button"
                    onclick={() => {
                      const newVal = roundToFiveCents((allocations[participant.id] || 0) - 0.05);
                      if (newVal >= 0) {
                        onAmountChange(participant.id, newVal.toFixed(2));
                      }
                    }}
                    class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 text-white rounded-l-lg flex items-center justify-center text-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={(allocations[participant.id] || 0) <= 0}
                    aria-label={`Decrease ${participant.name}'s amount by $0.05`}
                  >
                    −
                  </button>
                  
                  <!-- Amount Input -->
                  <input
                    type="text"
                    inputmode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={allocations[participant.id]?.toFixed(2) || '0.00'}
                    oninput={(e) => onAmountChange(participant.id, e)}
                    class="flex-1 min-w-0 h-10 sm:h-12 px-2 text-center bg-neutral-800 border-y border-neutral-700 text-white text-lg sm:text-xl font-mono focus:border-[#CB8E4C] focus:outline-none"
                    style="min-width: 80px;"
                  />
                  
                  <!-- Increase Button -->
                  <button
                    type="button"
                    onclick={() => {
                      const newVal = roundToFiveCents((allocations[participant.id] || 0) + 0.05);
                      onAmountChange(participant.id, newVal.toFixed(2));
                    }}
                    class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 text-white rounded-r-lg flex items-center justify-center text-xl font-bold transition-colors"
                    aria-label={`Increase ${participant.name}'s amount by $0.05`}
                  >
                    +
                  </button>
                </div>

                <!-- Percentage Display -->
                <div class="w-16 text-right text-xs text-neutral-500 font-mono">
                  {((allocations[participant.id] || 0) / totalParsed * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-center py-6 text-neutral-500 text-sm">
      Select participants to start splitting
    </div>
  {/if}
</div>

<style>
  /* Stepper button styling */
  button:active {
    transform: scale(0.95);
  }
</style>
