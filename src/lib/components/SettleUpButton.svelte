<script lang="ts">
  let { disabled = true } = $props();
</script>

<button
  {disabled}
  class="w-full py-4 px-6 bg-[#CB8E4C] hover:bg-[#B87D3D] text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CB8E4C] focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
>
  <span class="flex items-center justify-center gap-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Settle Up
  </span>
</button>
