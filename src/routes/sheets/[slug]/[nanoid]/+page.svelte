<script lang="ts">
  import { enhance } from '$app/forms';
  import SheetHeader from '$lib/components/SheetHeader.svelte';
  import ExpenseList from '$lib/components/ExpenseList.svelte';
  import SettleUpButton from '$lib/components/SettleUpButton.svelte';
  import Drawer from '$lib/components/Drawer.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import { Root as AvatarGroup, Item as AvatarGroupItem } from '$lib/components/ui/avatar-group';
  import type { Sheet, Participant, Expense } from '$lib/db';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Currency list from exchange rates (base EUR)
  const currencies = [
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

  // Get currency details by code
  function getCurrencyByCode(code: string) {
    return currencies.find(c => c.code === code);
  }

  let isDrawerOpen = $state(false);
  let splitType = $state('equal');
  let editingExpenseId = $state<number | null>(null);
  let editingExpense = $state<Expense | null>(null);
  let localExpenses = $state<Expense[]>([]);
  
  // Form field states
  let formDescription = $state('');
  let formAmount = $state('');
  let formPaidBy = $state('');
  let formSplitType = $state('equal');
  let formCurrency = $state('USD');
  
  // Settlement currency state - initialize from sheet or default to USD
  let settlementCurrency = $state((data.sheet as any)?.settlementCurrency || 'USD');
  
  // Update settlement currency on the server
  async function updateSettlementCurrency() {
    try {
      await fetch(window.location.pathname + '?/updateSettlementCurrency', {
        method: 'POST',
        body: new URLSearchParams({ currency: settlementCurrency })
      });
    } catch (error) {
      console.error('Failed to update settlement currency:', error);
    }
  }

  // Initialize local expenses from data
  $effect(() => {
    localExpenses = data.expenses;
  });

  function openAddDrawer() {
    editingExpenseId = null;
    editingExpense = null;
    formSplitType = 'equal';
    formDescription = '';
    formAmount = '';
    formPaidBy = '';
    formCurrency = data.sheet?.currency || 'USD';
    isDrawerOpen = true;
  }

  function openEditDrawer(expense: Expense) {
    editingExpenseId = expense.id;
    editingExpense = expense;
    formSplitType = expense.splitType || 'equal';
    
    // Update form fields
    formDescription = expense.description;
    formAmount = (expense.amount / 100).toFixed(2);
    formPaidBy = expense.paidBy.toString();
    formCurrency = (expense as any).currency || data.sheet?.currency || 'USD';
    
    // Force a microtask to ensure the form fields are updated before opening
    Promise.resolve().then(() => {
      isDrawerOpen = true;
    });
  }

  async function handleDelete() {
    if (!editingExpenseId) return;
    
    // Create a form data object for the delete action
    const formData = new FormData();
    formData.append('expenseId', editingExpenseId.toString());
    
    // Use fetch to call the delete action
    const response = await fetch(window.location.pathname + '?/deleteExpense', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.type === 'success' && result.data?.success) {
      // Update local expenses with the returned data
      const expensesData = (result.data as any)?.expenses;
      if (expensesData && Array.isArray(expensesData)) {
        localExpenses = expensesData;
      }
        isDrawerOpen = false;
        // Reset editing state and form fields
        editingExpenseId = null;
        editingExpense = null;
        formDescription = '';
        formAmount = '';
        formPaidBy = '';
        formSplitType = 'equal';
        formCurrency = data.sheet?.currency || 'USD';
    }
  }

  function getShareUrl() {
    if (typeof window !== 'undefined' && data.sheet) {
      return `${window.location.origin}/join/${data.sheet.nanoid}`;
    }
    return '';
  }

  function copyToClipboard() {
    const url = getShareUrl();
    if (url) {
      navigator.clipboard.writeText(url);
    }
  }
</script>

<svelte:head>
  <title>{data.sheet?.name || 'Sheet'} - shibasplit</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-6 min-h-screen bg-neutral-950 text-neutral-300">
  {#if data.sheet}
    <SheetHeader title={data.sheet.name} description={data.sheet.description || ''} onCopyInvite={copyToClipboard} />

    <!-- Participants Avatar Group -->
    <div class="mb-4 flex items-center gap-2">
      {#if data.participants.length > 0}
        <AvatarGroup>
          {#each data.participants.slice(0, 5) as participant (participant.id)}
            <AvatarGroupItem>
              {participant.name.charAt(0).toUpperCase()}
            </AvatarGroupItem>
          {/each}
          {#if data.participants.length > 5}
            <AvatarGroupItem class="bg-neutral-700 text-neutral-300 text-xs">
              +{data.participants.length - 5}
            </AvatarGroupItem>
          {/if}
        </AvatarGroup>
        <span class="text-neutral-400 text-sm">
          {data.participants.length} participant{data.participants.length !== 1 ? 's' : ''}
        </span>
      {:else}
        <p class="text-neutral-400 text-sm">No one has joined yet.</p>
      {/if}
    </div>

    <!-- Settlement Currency Section -->
    <div class="mb-4 flex items-center gap-2">
      <span class="text-neutral-400 text-sm">Settlement Currency:</span>
      <select
        bind:value={settlementCurrency}
        onchange={updateSettlementCurrency}
        class="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] cursor-pointer"
      >
        {#each currencies as currency}
          <option value={currency.code}>{currency.code} - {currency.name}</option>
        {/each}
      </select>
    </div>

    <!-- Add Expense Section -->
    <div class="mb-6">
      {#if data.participants.length > 0}
        <button
          onclick={openAddDrawer}
          class="w-full py-3 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      {:else}
        <!-- Invite People Card -->
        <div class="bg-neutral-900 rounded-xl p-5 shadow-lg border border-neutral-800">
          <h3 class="text-white font-semibold mb-1">Invite people</h3>
          <p class="text-neutral-400 text-sm mb-4">Share the link so people can join this split and add expenses.</p>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              value={getShareUrl()}
              class="flex-1 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white text-sm focus:outline-none"
            />
            <button
              onclick={copyToClipboard}
              class="px-4 py-3 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center min-w-[100px] text-sm leading-none cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      {/if}
    </div>

    <div>
      <ExpenseList expenses={localExpenses} participants={data.participants} onEdit={openEditDrawer} />
    </div>

    <div class="mt-6">
      <SettleUpButton />
    </div>
  {:else}
    <div class="text-center py-12">
      <h2 class="text-2xl font-bold text-white mb-4">Sheet not found</h2>
      <p class="text-neutral-400 mb-6">The sheet you're looking for doesn't exist or has been removed.</p>
      <a href="/" class="inline-block px-6 py-3 bg-[#CB8E4C] text-white rounded-lg hover:bg-[#B87D3D] transition-colors">
        Go Home
      </a>
    </div>
  {/if}

  <!-- Footer -->
  <footer class="mt-12 pt-8 border-t border-neutral-800">
    <div class="flex items-center justify-center gap-3">
      <Logo size="sm" href="/" />
    </div>
  </footer>
</main>

<!-- Add/Edit Expense Drawer -->
<Drawer bind:isOpen={isDrawerOpen} title={editingExpenseId ? "Edit Expense" : "Add Expense"}>
  {#if editingExpenseId}
    <!-- Delete form (only for editing) -->
    <form 
      method="POST" 
      action="?/deleteExpense"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success' && result.data?.success) {
            // Update local expenses with the returned data
            const expensesData = (result.data as any)?.expenses;
            if (expensesData && Array.isArray(expensesData)) {
              localExpenses = expensesData;
            }
            isDrawerOpen = false;
            // Reset editing state and form fields
            editingExpenseId = null;
            editingExpense = null;
            formDescription = '';
            formAmount = '';
            formPaidBy = '';
            formSplitType = 'equal';
          }
        };
      }}
      class="hidden"
    >
      <input type="hidden" name="expenseId" value={editingExpenseId} />
      <button type="submit" id="delete-submit" aria-label="Delete expense"></button>
    </form>
  {/if}

  <form 
    method="POST" 
    action={editingExpenseId ? `?/editExpense` : `?/addExpense`} 
    use:enhance={() => {
      return async ({ result, formData }) => {
        if (result.type === 'success' && result.data?.success) {
          // Update local expenses with the returned data
          const expensesData = (result.data as any)?.expenses;
          if (expensesData && Array.isArray(expensesData)) {
            localExpenses = expensesData;
          }
          isDrawerOpen = false;
          // Reset editing state and form fields
          editingExpenseId = null;
          editingExpense = null;
          formDescription = '';
          formAmount = '';
          formPaidBy = '';
          formSplitType = 'equal';
        }
      };
    }}
    class="space-y-4">
    {#if editingExpenseId}
      <input type="hidden" name="expenseId" value={editingExpenseId} />
    {/if}

    <div>
      <label for="description" class="block text-sm font-medium text-neutral-300 mb-1">Description</label>
      <input
        type="text"
        id="description"
        name="description"
        required
        bind:value={formDescription}
        class="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent"
        placeholder="What was this expense for?"
      />
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-neutral-300 mb-1">Amount</label>
      <input
        type="number"
        id="amount"
        name="amount"
        required
        min="0"
        step="0.01"
        bind:value={formAmount}
        class="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent"
        placeholder="0.00"
      />
    </div>

    <div>
      <label for="currency" class="block text-sm font-medium text-neutral-300 mb-1">Currency</label>
      <div class="relative">
        <div class="flex items-center gap-2">
          <div class={`flex-1 relative ${getCurrencyByCode(formCurrency) ? 'pr-12' : ''}`}>
            <input
              type="text"
              id="currency"
              name="currency"
              bind:value={formCurrency}
              class="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent"
              placeholder="Search currency..."
              autocomplete="off"
              list="currency-list"
            />
            <datalist id="currency-list">
              {#each currencies as currency}
                <option value={currency.code}>{currency.name}</option>
              {/each}
            </datalist>
          </div>
          {#if getCurrencyByCode(formCurrency)}
            <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <span class="text-neutral-500 text-sm">|</span>
              <span class="text-neutral-300 text-sm">{getCurrencyByCode(formCurrency)?.symbol}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div>
      <label for="paidBy" class="block text-sm font-medium text-neutral-300 mb-1">Paid By</label>
      <select
        id="paidBy"
        name="paidBy"
        required
        bind:value={formPaidBy}
        class="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent"
      >
        <option value="">Select who paid</option>
        {#each data.participants as participant}
          <option value={participant.id.toString()}>{participant.name}</option>
        {/each}
      </select>
    </div>

    <div>
      <span class="block text-sm font-medium text-neutral-300 mb-3">Split Type</span>
      <div class="grid grid-cols-2 gap-3" role="group" aria-label="Split Type">
        <!-- Equal Split Button -->
        <button
          type="button"
          onclick={() => formSplitType = 'equal'}
          class={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            formSplitType === 'equal' 
              ? 'border-[#CB8E4C] bg-[#CB8E4C]/10' 
              : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
          }`}
        >
          <div class="flex items-center gap-3">
            <div class={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              formSplitType === 'equal' ? 'bg-[#CB8E4C]' : 'bg-neutral-700'
            }`}>
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div class="text-left">
              <div class={`font-medium ${formSplitType === 'equal' ? 'text-white' : 'text-neutral-300'}`}>
                Equal Split
              </div>
              <div class="text-xs text-neutral-500">
                {data.participants.length} participants × ${(formAmount ? parseFloat(formAmount) / data.participants.length : 0).toFixed(2)}
              </div>
            </div>
          </div>
          {#if formSplitType === 'equal'}
            <div class="absolute -top-2 -right-2 w-5 h-5 bg-[#CB8E4C] rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          {/if}
        </button>

        <!-- Custom Split Button -->
        <button
          type="button"
          onclick={() => formSplitType = 'custom'}
          class={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            formSplitType === 'custom' 
              ? 'border-[#CB8E4C] bg-[#CB8E4C]/10' 
              : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
          }`}
        >
          <div class="flex items-center gap-3">
            <div class={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              formSplitType === 'custom' ? 'bg-[#CB8E4C]' : 'bg-neutral-700'
            }`}>
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>
            <div class="text-left">
              <div class={`font-medium ${formSplitType === 'custom' ? 'text-white' : 'text-neutral-300'}`}>
                Custom Split
              </div>
              <div class="text-xs text-neutral-500">
                Set amounts per person
              </div>
            </div>
          </div>
          {#if formSplitType === 'custom'}
            <div class="absolute -top-2 -right-2 w-5 h-5 bg-[#CB8E4C] rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          {/if}
        </button>
      </div>
    </div>

    <!-- Equal Split Preview Table -->
    {#if formSplitType === 'equal' && formAmount && parseFloat(formAmount) > 0}
      <div class="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Contribution Breakdown</span>
          <span class="text-xs text-neutral-500">
            {data.participants.length} ways
          </span>
        </div>
        <div class="space-y-2">
          {#each data.participants as participant}
            {#if participant.id.toString() === formPaidBy}
              <div class="flex items-center justify-between p-2 rounded-lg bg-[#CB8E4C]/10 border border-[#CB8E4C]/30">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-[#CB8E4C]"></div>
                  <span class="text-sm text-white">{participant.name}</span>
                  <span class="text-xs text-neutral-500">(paid)</span>
                </div>
                <span class="text-sm text-[#CB8E4C] font-medium">
                  ${(parseFloat(formAmount) / data.participants.length).toFixed(2)}
                </span>
              </div>
            {:else}
              <div class="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-neutral-600"></div>
                  <span class="text-sm text-neutral-300">{participant.name}</span>
                </div>
                <span class="text-sm text-neutral-400">
                  ${(parseFloat(formAmount) / data.participants.length).toFixed(2)}
                </span>
              </div>
            {/if}
          {/each}
        </div>
        <div class="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
          <span class="text-sm text-neutral-400">Total</span>
          <span class="text-sm text-white font-medium">${formAmount}</span>
        </div>
      </div>
    {/if}

    {#if form?.error}
      <p class="text-red-400 text-sm">{form.error}</p>
    {/if}

    <div class="pt-4 flex gap-3">
      <button
        type="submit"
        class="flex-1 py-3 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 cursor-pointer"
      >
        {editingExpenseId ? 'Update' : 'Save'}
      </button>
      {#if editingExpenseId}
        <button
          type="button"
          onclick={() => document.getElementById('delete-submit')?.click()}
          class="px-4 py-3 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-300 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center"
          aria-label="Delete expense"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      {/if}
    </div>
  </form>
</Drawer>
