<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Sheet } from '$lib/db';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form?: ActionData } = $props();
</script>

<svelte:head>
  <title>Join Sheet - shibasplit</title>
</svelte:head>

<main class="min-h-screen bg-neutral-950 text-neutral-300 flex items-center justify-center px-4">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <img src="/shibaLogo.svg" alt="shibasplit logo" class="w-16 h-16 mx-auto mb-4" />
      <h1 class="text-3xl font-bold text-white">Join Sheet</h1>
      {#if data.sheet}
        <p class="text-neutral-400 mt-2">Join "{data.sheet.name}"</p>
      {/if}
    </div>

    {#if data.sheet}
      <form method="POST" use:enhance class="space-y-4 bg-neutral-900 rounded-2xl p-6 shadow-lg border border-neutral-800">
        <div>
          <label for="displayName" class="block text-sm font-medium text-neutral-300 mb-1">Your Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            required
            minlength="2"
            maxlength="50"
            class="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>

        {#if form?.error}
          <p class="text-red-400 text-sm">{form.error}</p>
        {/if}

        <button
          type="submit"
          class="w-full py-3 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          Join Sheet
        </button>
      </form>
    {:else}
      <div class="text-center bg-neutral-900 rounded-2xl p-6 shadow-lg border border-neutral-800">
        <h2 class="text-xl font-bold text-white mb-2">Sheet Not Found</h2>
        <p class="text-neutral-400 mb-4">This sheet doesn't exist or has been removed.</p>
        <a href="/" class="inline-block px-6 py-3 bg-[#CB8E4C] text-white rounded-lg hover:bg-[#B87D3D] transition-colors">
          Go Home
        </a>
      </div>
    {/if}
  </div>
</main>