<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { form, data }: { form?: ActionData; data: PageData } = $props();
</script>

<svelte:head>
  <title>shibasplit - Split Expenses Easily</title>
</svelte:head>

<main class="min-h-screen bg-neutral-950 text-neutral-300 flex flex-col justify-center">
  <!-- Hero Section -->
  <div class="flex-1 flex justify-center">
    <div class="max-w-4xl px-4 py-16 md:py-24 w-full">
    <!-- Logo/Brand -->
    <div class="mb-8">
       <div class="mb-4">
          <img src="/shibaLogo.svg" alt="shibasplit logo" class="w-12 h-12" />
       </div>
       <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight">
         shibasplit
       </h1>
       <p class="text-lg text-neutral-400 mt-2">Split expenses with friends. No account needed.</p>
     </div>

     <!-- Hero Content -->
     <div class="mb-12">
       <p class="text-xl text-neutral-300 max-w-full leading-relaxed">
         Create a shared expense sheet, share the link with your group, and let shibasplit handle the math. 
         Perfect for trips, group gifts, shared housing, and more.
       </p>
     </div>

    <!-- Your Splits Section -->
    {#if data.recentSheets && data.recentSheets.length > 0}
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-white mb-4">Your splits</h2>
        <div class="flex gap-3 overflow-x-auto pb-2">
          {#each data.recentSheets as sheet}
            <a
              href="/sheets/{sheet.slug}/{sheet.nanoid}"
              class="flex-shrink-0 w-40 bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700 transition-colors border border-neutral-700 cursor-pointer"
            >
              <p class="text-white font-medium truncate">{sheet.slug}</p>
              <p class="text-neutral-400 text-xs mt-1">View split</p>
            </a>
          {/each}
          {#if data.recentSheets.length >= 3}
            <button
              type="button"
              class="flex-shrink-0 w-40 bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700/50 transition-all cursor-pointer"
            >
              <p class="text-sm">Create more splits</p>
              <p class="text-xs mt-1 opacity-70">Sign up for unlimited</p>
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Main CTA -->
    <div class="mb-16">
      <form method="POST" use:enhance class="max-w-full">
         <div class="flex flex-col sm:flex-row gap-3">
           <input
             type="text"
             name="sheetName"
             placeholder="Name your sheet (e.g., 'Trip to Italy')"
             class="flex-1 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent shadow-sm"
             required
             minlength="3"
             maxlength="300"
             title="Only letters, numbers, dashes (-), underscores (_), spaces, and emojis allowed"
           />
            <button
              type="submit"
              class="px-8 py-3 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:ring-offset-2 focus:ring-offset-neutral-950 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
             Create Sheet
           </button>
         </div>
         {#if form?.error}
           <p class="text-red-400 mt-2 text-sm">{form.error}</p>
         {/if}
       </form>
     </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-3 gap-4 text-left max-w-full">
        <div class="bg-neutral-900 rounded-xl p-6 shadow-md border border-neutral-800">
          <div class="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-5 h-5 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          </div>
          <h3 class="font-semibold text-white mb-2">Share Instantly</h3>
        <p class="text-sm text-neutral-400">Share a simple link with your group. No downloads or sign-ups required.</p>
      </div>

      <div class="bg-neutral-900 rounded-xl p-6 shadow-md border border-neutral-800">
        <div class="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-5 h-5 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          </div>
          <h3 class="font-semibold text-white mb-2">Track Expenses</h3>
        <p class="text-sm text-neutral-400">Add expenses as they happen. Everyone can see the running total.</p>
      </div>

      <div class="bg-neutral-900 rounded-xl p-6 shadow-md border border-neutral-800">
        <div class="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-5 h-5 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          </div>
          <h3 class="font-semibold text-white mb-2">Smart Settlements</h3>
        <p class="text-sm text-neutral-400">shibasplit calculates who owes whom, so you settle up efficiently.</p>
       </div>
     </div>
   </div>
 </div>

   <!-- Footer -->
  <footer class="py-8 text-center text-neutral-500 text-sm">
    <p>Privacy-first expense splitting. No accounts. No ads.</p>
  </footer>
</main>
