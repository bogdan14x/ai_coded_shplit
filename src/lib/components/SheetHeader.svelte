<script lang="ts">
  let { title, description, onCopyInvite } = $props();
  let copySuccess = $state(false);

  function handleCopy() {
    onCopyInvite?.();
    copySuccess = true;
    setTimeout(() => {
      copySuccess = false;
    }, 2000);
  }
</script>

<header class="sheet-header mb-4 slide-up">
  <!-- Title and description (left aligned) -->
  <div>
    <h1 class="text-3xl font-display font-bold tracking-tight text-white">{title}</h1>
    {#if description}
      <p class="text-neutral-400 mt-1 text-lg">{description}</p>
    {/if}
  </div>
</header>

<style>
  /* Share button styling */
  .share-button {
    position: relative;
    padding: 12px 20px;
    background-color: #0a0a0a;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    border: 1px solid #3f3f46;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .share-button:hover {
    background-color: #1a1a1a;
    border-color: #52525b;
  }
  
  .share-button svg {
    width: 16px;
    height: 16px;
    color: #CB8E4C;
  }
  
  .share-button .success-icon {
    color: #22c55e;
  }
</style>
