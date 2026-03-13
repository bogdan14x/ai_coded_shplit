<script lang="ts">
  let { class: className = '', children, ...rest } = $props();
</script>

<div class="flex -space-x-1 overflow-hidden {className}" {...rest}>
  {@render children()}
</div>
