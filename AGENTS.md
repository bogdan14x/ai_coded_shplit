# AGENTS.md

This file contains design context and guidelines for future AI agents working on the ShibaSplit project.

## Design Context

### Users

**Primary User:** General social groups (friends, colleagues, acquaintances) splitting expenses together.

**Context:** Users access the app via shared URLs to quickly split costs without creating accounts. They're typically on mobile devices, often in social settings (restaurants, after trips, during events) where they need to settle up quickly and accurately.

**Job to be Done:** Split group expenses fairly and efficiently without the hassle of tracking who paid what manually.

**Emotional Goals:**
- **Confidence & Trust** - Users need to trust that calculations are accurate
- **Calm & Clarity** - Interface should feel peaceful, not stressful or overwhelming
- **Speed & Efficiency** - Quick to use, get in and out fast

### Brand Personality

**3-Word Personality:** Modern, Clean, Professional

**Voice & Tone:**
- Professional but not corporate
- Clear and direct communication
- Helpful without being overly casual
- Trustworthy and reliable

**Visual Tone:**
- Sleek and contemporary
- Functional over decorative
- Professional-grade quality
- Refined but approachable

### Aesthetic Direction

**Theme:** Dark mode with warm accent colors

**Color Palette:**
- **Background:** Deep black/charcoal (#0a0a0a, #171717)
- **Accent:** Warm golden/tan (#CB8E4C) for primary actions and highlights
- **Neutrals:** Gray scale for text and borders
- **Success:** Green for positive feedback

**Typography:**
- System fonts for performance and familiarity
- Clear hierarchy with size and weight
- Neutral colors for text hierarchy

**Visual Style:**
- Card-based design with rounded corners
- Subtle borders and shadows for depth
- Smooth transitions and animations
- Mobile-first responsive layouts

**Anti-References:**
- NOT overly playful or cartoonish
- NOT busy or cluttered
- NOT bright/flashy colors
- NOT corporate/enterprise aesthetic

### Design Principles

1. **Mobile-First Simplicity**
   - Design for touch interaction first
   - Clear visual hierarchy on small screens
   - Minimal cognitive load

2. **Trust Through Clarity**
   - Show calculations transparently
   - Clear error states and validation
   - Consistent, predictable interactions

3. **Professional Polish**
   - Attention to detail in spacing and alignment
   - Smooth, purposeful animations
   - Consistent design patterns throughout

4. **Privacy by Design**
   - No unnecessary data collection
   - Clear value exchange (URL sharing for convenience)
   - Respect user choice and control

5. **Performance is Design**
   - Fast load times and interactions
   - Efficient reactivity with Svelte 5
   - Smooth 60fps animations

## Technical Design Tokens

### Colors
```css
--color-accent: #CB8E4C;
--color-accent-dark: #B87D3D;
--color-background: #0a0a0a;
--color-surface: #171717;
--color-border: #404040;
--color-text-primary: #d4d4d4;
--color-text-muted: #a3a3a3;
--color-text-light: #737373;
--color-success: #22c55e;
```

### Spacing Scale
- Base unit: 4px
- Scale: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 1.75rem, 2rem, 3rem, 4rem

### Typography Scale
- XS: 0.75rem (12px) - Captions, labels
- SM: 0.875rem (14px) - Secondary text
- Base: 1rem (16px) - Body text
- LG: 1.125rem (18px) - Large body
- XL: 1.25rem (20px) - Small headings
- 2XL: 1.5rem (24px) - Section headings
- 3XL: 1.875rem (30px) - Page titles
- 4XL: 2.25rem (36px) - Hero titles

### Component Patterns
- **Buttons:** Rounded (lg or xl), border + background on hover, accent icon
- **Cards:** Rounded (xl), subtle border, slight shadow
- **Inputs:** Rounded (lg), border, focus ring with accent color
- **Modals:** Backdrop blur, rounded corners, smooth entrance animation

## Implementation Guidelines

### Svelte 5 Patterns
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props
- Use `onclick` instead of `on:click`

### Accessibility Standards
- WCAG 2.1 Level AA compliance
- Minimum 44x44px touch targets
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Focus management in modals

### Performance Considerations
- Minimize re-renders with Svelte 5 runes
- Lazy load heavy components
- Optimize images and assets
- Use efficient data structures

---

*Last updated: 2026-03-15*