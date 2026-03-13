<script lang="ts">
  import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
  
  let { src = undefined, alt = undefined, class: className = '', children, ...rest } = $props();
</script>

<Avatar class={className} {...rest}>
  {#if src}
    <AvatarImage {src} {alt} />
  {/if}
  <AvatarFallback>
    {@render children()}
  </AvatarFallback>
</Avatar>
