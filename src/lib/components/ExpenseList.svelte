<script lang="ts">
  import type { Expense, Participant } from '$lib/db';

  let { expenses, participants, onEdit } = $props();

  // Pagination state
  let currentPage = $state(1);
  const itemsPerPage = 50;

  // Computed values for pagination
  const totalPages = $derived(Math.ceil(expenses.length / itemsPerPage));
  const startIndex = $derived((currentPage - 1) * itemsPerPage);
  const endIndex = $derived(startIndex + itemsPerPage);
  const paginatedExpenses = $derived(expenses.slice(startIndex, endIndex));

  function getParticipantName(participantId: number): string {
    const participant = participants.find((p: Participant) => p.id === participantId);
    return participant?.name || 'Unknown';
  }

  function formatAmount(cents: number, currency: string = 'USD'): string {
    try {
      const amount = (cents / 100).toFixed(2);
      return amount;
    } catch {
      return (cents / 100).toFixed(2);
    }
  }

  function handleEdit(expense: Expense) {
    onEdit?.(expense);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  // Reset to page 1 when expenses change
  $effect(() => {
    if (expenses.length > 0) {
      currentPage = 1;
    }
  });
</script>

<section class="expense-list bg-neutral-900 shadow-lg rounded-xl p-5 mb-6 fade-in border border-neutral-800">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-white flex items-center">
      <svg class="w-5 h-5 mr-2 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      Expenses
      {#if expenses.length > 0}
        <span class="ml-2 text-sm font-normal text-neutral-400">({expenses.length} total)</span>
      {/if}
    </h2>
    
    <!-- Pagination Controls -->
    {#if totalPages > 1}
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={prevPage}
          disabled={currentPage === 1}
          class="w-8 h-8 flex items-center justify-center rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span class="text-sm text-neutral-400 min-w-[80px] text-center">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          type="button"
          onclick={nextPage}
          disabled={currentPage === totalPages}
          class="w-8 h-8 flex items-center justify-center rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
  
  {#if expenses.length === 0}
    <p class="text-neutral-500 text-center py-4">No expenses yet.</p>
  {:else}
    <ul class="space-y-3">
      {#each paginatedExpenses as expense, index}
        <li style="animation-delay: {index * 0.1}s">
          <button
            type="button"
            class="w-full flex justify-between items-center py-3 px-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer text-left"
            onclick={() => handleEdit(expense)}
            onkeydown={(e) => e.key === 'Enter' && handleEdit(expense)}
          >
            <div class="flex-1">
              <p class="font-medium text-white">{expense.description}</p>
              <p class="text-sm text-neutral-400 flex items-center mt-1 gap-2">
                <span class="w-2 h-2 bg-[#CB8E4C] rounded-full"></span>
                Paid by {getParticipantName(expense.paidBy)}
                <span class="text-neutral-600">•</span>
                <span class="text-neutral-500 text-xs uppercase">{expense.splitType || 'equal'}</span>
              </p>
            </div>
            <div class="flex flex-col items-end">
              {#if expense.currency && expense.currency !== 'USD'}
                <span class="text-xs text-neutral-500 uppercase tracking-wider">{expense.currency}</span>
              {/if}
              <div class="flex items-baseline gap-0.5 font-tabular font-semibold">
                <span class="text-[#CB8E4C] text-lg opacity-80">$</span>
                <span class="text-white text-xl tracking-tight">{formatAmount(expense.amount, expense.currency || 'USD')}</span>
              </div>
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
