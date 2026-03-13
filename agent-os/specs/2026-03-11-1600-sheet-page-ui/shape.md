# Sheet Page UI — Shaping Notes

## Scope

Build a mobile-first sheet page UI for shibasplit expense tracking app. This is a frontend-only feature with no backend integration for now.

The sheet page should display:
- Sheet title and description
- Participants displayed via AvatarGroup below the title
- List of expenses (read-only for now)
- Settle Up button (disabled/non-functional)

## Decisions

- **Frontend-only**: No backend integration for now
- **Mobile-first**: Design for mobile first, then adapt for larger screens
- **Mock data**: Use mock data for demonstration
- **SvelteKit**: Use SvelteKit with Vite for the frontend framework
- **Tailwind CSS**: Use Tailwind CSS for styling

## Context

- **Visuals**: Mobile-first design layout guide from `/Users/bogdan14x/Desktop/Screenshot 2026-03-11 at 15.57.40.png`
- **References**: No existing references in the codebase
- **Product alignment**: Aligns perfectly with product goals (privacy-first, simple URL sharing, modern UI)

## Standards Applied

- **frontend/components** — Reusable component patterns
- **frontend/styling** — CSS/Tailwind styling conventions
- **sveltekit/routing** — SvelteKit page routing patterns
- **ui/responsive-design** — Mobile-first responsive design
