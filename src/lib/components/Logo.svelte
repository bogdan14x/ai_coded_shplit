<script lang="ts">
  let { size = 'md', href = '/' } = $props();
</script>

<a href={href} class="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
  <img 
    src="/shibaLogo.svg" 
    alt="shibasplit logo" 
    class="{size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'}"
  />
  <span class="text-neutral-300 font-semibold">shibasplit</span>
</a>
