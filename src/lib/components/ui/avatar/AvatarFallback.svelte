<script lang="ts">
  let { class: className = '', children, ...rest } = $props();
</script>

<div
  class="flex h-full w-full items-center justify-center rounded-full bg-neutral-700 text-neutral-300 text-xs font-medium {className}"
  {...rest}
>
  {@render children()}
</div>
