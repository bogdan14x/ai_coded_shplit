# Standards for Sheet Page UI

The following standards apply to this work.

---

## frontend/components

### Reusable Component Patterns

Create reusable, composable components following these patterns:

1. **Single Responsibility**: Each component should do one thing well
2. **Props Interface**: Define clear TypeScript interfaces for component props
3. **Event Emissions**: Use custom events for component communication
4. **Slots**: Use Svelte slots for flexible content insertion

Example:
```svelte
<!-- SheetHeader.svelte -->
<script lang="ts">
  export let title: string;
  export let description: string;
</script>

<header class="sheet-header">
  <h1>{title}</h1>
  <p>{description}</p>
</header>
```

---

## frontend/styling

### Tailwind CSS Conventions

1. **Mobile-first**: Start with base styles, use media queries for larger screens
2. **Utility classes**: Use Tailwind utility classes for styling
3. **Custom colors**: Define custom colors in tailwind.config.js
4. **Responsive design**: Use responsive prefixes (sm:, md:, lg:)

Example:
```svelte
<div class="container mx-auto px-4 py-6 md:px-8 md:py-10">
  <!-- Content -->
</div>
```

---

## sveltekit/routing

### SvelteKit Page Routing Patterns

1. **File-based routing**: Use `+page.svelte` and `+page.ts` files
2. **Dynamic routes**: Use `[slug]` for dynamic parameters
3. **Data loading**: Use `+page.ts` for data loading
4. **Server-side rendering**: Use SSR for initial page load

Example:
```
src/routes/
  sheets/
    [slug]/
      +page.svelte
      +page.ts
```

---

## ui/responsive-design

### Mobile-First Responsive Design

1. **Base styles**: Design for mobile first (320px - 768px)
2. **Media queries**: Use Tailwind responsive prefixes for larger screens
3. **Flexible layouts**: Use flexbox or grid for adaptive layouts
4. **Touch targets**: Ensure touch targets are at least 44x44px

Example:
```svelte
<div class="flex flex-col md:flex-row">
  <!-- Mobile: column, Desktop: row -->
</div>
```
