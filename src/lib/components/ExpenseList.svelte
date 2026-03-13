<script lang="ts">
  import type { Expense, Participant } from '$lib/db';

  let { expenses, participants, onEdit } = $props();

  function getParticipantName(participantId: number): string {
    const participant = participants.find((p: Participant) => p.id === participantId);
    return participant?.name || 'Unknown';
  }

  function formatAmount(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  }

  function handleEdit(expense: Expense) {
    onEdit?.(expense);
  }
</script>

<section class="expense-list bg-neutral-900 shadow-lg rounded-xl p-5 mb-6 fade-in border border-neutral-800">
  <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
    <svg class="w-5 h-5 mr-2 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    Expenses
  </h2>
  
  {#if expenses.length === 0}
    <p class="text-neutral-500 text-center py-4">No expenses yet.</p>
  {:else}
    <ul class="space-y-3">
      {#each expenses as expense, index}
        <li style="animation-delay: {index * 0.1}s">
          <button
            type="button"
            class="w-full flex justify-between items-center py-3 px-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer text-left"
            onclick={() => handleEdit(expense)}
            onkeydown={(e) => e.key === 'Enter' && handleEdit(expense)}
          >
            <div class="flex-1">
              <p class="font-medium text-white">{expense.description}</p>
              <p class="text-sm text-neutral-400 flex items-center mt-1">
                <span class="w-2 h-2 bg-[#CB8E4C] rounded-full mr-2"></span>
                Paid by {getParticipantName(expense.paidBy)}
              </p>
            </div>
            <span class="font-semibold text-[#CB8E4C] text-lg">{formatAmount(expense.amount)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
