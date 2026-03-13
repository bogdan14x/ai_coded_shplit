<script lang="ts">
  let { isOpen = $bindable(false), title = '', children } = $props();

  function close() {
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
    onclick={handleBackdropClick}
    aria-label="Close drawer"
  ></button>

  <!-- Drawer Content -->
  <div
    class="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl z-50 shadow-2xl transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col"
    style="max-height: 85vh;"
  >
    <!-- Handle -->
    <button
      type="button"
      class="pt-3 pb-2 flex justify-center w-full cursor-pointer"
      onclick={close}
      aria-label="Close drawer"
    >
      <div class="w-12 h-1.5 bg-neutral-600 rounded-full"></div>
    </button>

    <!-- Header -->
    <div class="px-6 py-3 border-b border-neutral-800">
      <h2 class="text-xl font-semibold text-white text-center">{title}</h2>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      {@render children()}
    </div>
  </div>
{/if}
