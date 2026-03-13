<script lang="ts">
  let { src, alt, class: className = '', ...rest } = $props();
</script>

<img
  {src}
  {alt}
  class="aspect-square h-full w-full {className}"
  {...rest}
/>
