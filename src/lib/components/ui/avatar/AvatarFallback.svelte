<script lang="ts">
  let { class: className = '', children, ...rest } = $props();
</script>

<div
  class="flex h-full w-full items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 {className}"
  {...rest}
>
  {@render children()}
</div>
