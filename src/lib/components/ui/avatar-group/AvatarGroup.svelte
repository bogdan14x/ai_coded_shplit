<script lang="ts">
  let { class: className = '', children } = $props();
</script>

<div class="flex -space-x-1 overflow-hidden {className}">
  {@render children()}
</div>
