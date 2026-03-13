<script lang="ts">
  import type { Participant } from '$lib/db';

  let { participants } = $props();
</script>

<section class="participant-list bg-neutral-900 shadow-lg rounded-xl p-5 mb-6 fade-in border border-neutral-800">
  <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
    <svg class="w-5 h-5 mr-2 text-[#CB8E4C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    Participants
  </h2>
  
  {#if participants.length === 0}
    <p class="text-neutral-500 text-center py-4">No participants yet.</p>
  {:else}
    <ul class="space-y-3">
      {#each participants as participant, index}
        <li class="flex items-center justify-between py-3 px-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors" style="animation-delay: {index * 0.1}s">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#CB8E4C] to-amber-900 flex items-center justify-center mr-3 text-white font-semibold shadow-md">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span class="text-white font-medium">{participant.name}</span>
              {#if participant.isCreator === true}
                <span class="ml-2 text-xs bg-[#CB8E4C] text-white px-2 py-0.5 rounded-full">Creator</span>
              {/if}
            </div>
          </div>
          <div class="text-neutral-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
