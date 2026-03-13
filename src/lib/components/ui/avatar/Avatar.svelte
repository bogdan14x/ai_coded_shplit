<script lang="ts">
  let { class: className = '', children, ...rest } = $props();
</script>

<div
  class="inline-block size-6 rounded-full ring-2 ring-neutral-900 outline -outline-offset-1 outline-white/10 overflow-hidden {className}"
  {...rest}
>
  {@render children()}
</div>
