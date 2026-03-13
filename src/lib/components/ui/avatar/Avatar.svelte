<script lang="ts">
  let { class: className = '', children, ...rest } = $props();
</script>

<div
  class="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full {className}"
  {...rest}
>
  {@render children()}
</div>
