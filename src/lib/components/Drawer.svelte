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

<!-- Backdrop -->
<button
  type="button"
  class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 {isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
  onclick={handleBackdropClick}
  aria-label="Close drawer"
  tabindex={isOpen ? 0 : -1}
></button>

<!-- Drawer Content -->
<div
  class="fixed bottom-0 left-0 right-0 h-screen bg-neutral-900 z-50 shadow-2xl transform transition-all duration-300 ease-out flex flex-col {isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}"
>
  <!-- Handle -->
  <button
    type="button"
    class="pt-3 pb-2 flex justify-center w-full cursor-pointer hover:bg-neutral-800/50 transition-colors"
    onclick={close}
    aria-label="Close drawer"
    tabindex={isOpen ? 0 : -1}
  >
    <div class="w-12 h-1.5 bg-neutral-600 rounded-full"></div>
  </button>

  <!-- Header -->
  <div class="px-6 py-3 border-b border-neutral-800">
    <h2 class="text-xl font-semibold text-white text-center">{title}</h2>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto px-6 py-4 pb-20">
    {@render children()}
  </div>
</div>
