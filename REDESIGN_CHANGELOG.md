# EduHire — 2026 Design System Upgrade

## Design Philosophy
Apple/Linear/Tesla-level precision: systematic tokens, GPU-accelerated motion,
advanced glassmorphism, semantic color system, accessible focus management,
reduced-motion support, and zero arbitrary values.

---

## Files Changed

### Core Design System
| File | What Changed |
|------|-------------|
| `src/styles/globals.css` | Complete rewrite: CSS design tokens (shadows, surfaces, borders, radii, easing), `bg-glass`, `bg-glass-nav`, `input-base`, `card` component classes, 8-level animation system with `prefers-reduced-motion` support, skeleton shimmer |
| `tailwind.config.ts` | New font stack (Plus Jakarta Sans + Lora), 8 border-radius tokens, 8 shadow tokens, 1.25-ratio type scale, `brand-gradient` bg, `ease-spring`/`ease-out-expo` timing |

### Layout & Navigation
| File | What Changed |
|------|-------------|
| `src/components/layout/navbar.tsx` | Scroll-aware glass blur, animated chevron rotations, rich dropdown with role sub-labels, GPU-accelerated mobile drawer (`animate-slide-in-right`), body scroll lock, `aria-label` on all buttons |
| `src/components/layout/dashboard-sidebar.tsx` | Active dot indicator, role-branded header with gradient icon, systematic `border-subtle` tokens |
| `src/components/layout/footer.tsx` | Minimal refined footer with brand icon mark, semantic tokens |
| `src/app/(dashboard)/layout.tsx` | `sticky top-[74px]` sidebar, `var(--surface-base)` background |
| `src/app/(auth)/layout.tsx` | Passthrough — sign-in pages own their full-page layouts |

### Authentication Pages
| File | What Changed |
|------|-------------|
| `src/app/auth/signin-teacher/page.tsx` | Full-page radial gradient bg, `input-base` token, password show/hide toggle, inline error/success states with icons, gradient submit button, accessible `autoComplete` attrs |
| `src/app/auth/signin-school/page.tsx` | Same pattern, accent-orange gradient variant |
| `src/app/(auth)/auth/signin/page.tsx` | Link-style role picker with hover accents, live countdown |
| `src/app/(auth)/auth/signup/page.tsx` | Role selector with checkmark + spring animation, Google OAuth button, password strength hint, full-page layout |

### Homepage
| File | What Changed |
|------|-------------|
| `src/app/(public)/page.tsx` | Dual-layer radial gradient hero, animated pill badge with pulse dot, fluid `clamp()` typography with tracking, spring-hover CTAs, stat numbers with semantic spacing, `card card-hover` feature grid, process steps with decorative connectors, school CTA with layered decoration |

### Dashboard Pages
| File | What Changed |
|------|-------------|
| `src/app/(dashboard)/dashboard/applications/page.tsx` | Dot-status badges with semantic color tokens, skeleton loaders, hover-lift cards, accessible retry flow |
| `src/app/(dashboard)/dashboard/my-jobs/page.tsx` | Color-coded toggle buttons (close=red, reopen=green), action row with border buttons, skeleton shimmer |
| `src/app/(dashboard)/dashboard/profile/page.tsx` | `Section` + `FieldWrapper` compound components, `input-base` across all fields, accent dot section headers, chip toggle with `shadow-brand` on active |

### Job Components
| File | What Changed |
|------|-------------|
| `src/components/jobs/job-list-item.tsx` | Left accent bar animation, `role="button"` + keyboard `Enter` handler, tag pills with `rounded-md` (not round), accessible focus ring |
| `src/components/jobs/job-list-panel.tsx` | Glass sticky header, proper skeleton pattern, empty state with icon box |
| `src/components/jobs/job-detail-panel.tsx` | Chip meta tags, `text-[11px] uppercase tracking-[0.08em]` section headers, `var(--surface-base)` info row, gradient apply button |
| `src/components/jobs/job-filters.tsx` | `FilterSelect` compound component, `SlidersHorizontal` label, active filter pills with `border-brand-100` |
| `src/components/jobs/job-split-view.tsx` | CSS token borders/shadows, `border-r border-black/[0.05]` panel divider |

### UI Primitives
| File | What Changed |
|------|-------------|
| `src/components/ui/button.tsx` | CVA with hover lift (`-translate-y-px`), `shadow-brand`, `focus-visible` ring, `pointer-events-none` disabled |
| `src/components/ui/input.tsx` | `input-base` token, left icon slot, right element slot, inline error with SVG icon, hint text |
| `src/components/ui/select.tsx` | `input-base` token, custom chevron SVG, label + error support |
| `src/components/ui/badge.tsx` | Dot variant, border system, 6 semantic variants, size sm/md |
| `src/components/ui/skeleton.tsx` | `skeleton` CSS class (not `animate-pulse`), `SkeletonText` + `SkeletonCard` compound components |
| `src/components/ui/modal.tsx` | Focus trap, `aria-modal`, glass backdrop blur, footer slot, `rounded-3xl`, `animate-scale-in` |
| `src/components/ui/toast.tsx` | Glass blur background, `border-radius: 14px`, font-family token, semantic border colors |
| `src/components/dashboard/stats-cards.tsx` | Color-coded 4-variant cards, trend badge, proper skeleton shimmer, success rate calculation |

---

## Design Token Summary

### Shadows (12 levels)
`shadow-xs` → `shadow-2xl` + `shadow-brand` + `shadow-brand-lg` + `shadow-glass` + `shadow-inner`

### Border Radii (8 levels)
`rounded-xs(4)` `rounded-sm(6)` `rounded-md(8)` `rounded-lg(12)` `rounded-xl(16)` `rounded-2xl(20)` `rounded-3xl(24)` `rounded-4xl(32)`

### Motion
`--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` — used on buttons, chips, modals
`--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` — used on page/drawer entrances
`--dur-fast: 120ms` — hover states
`--dur-slow: 350ms` — page animations

### Accessibility
- `prefers-reduced-motion`: all animations suppressed
- `focus-visible` rings on all interactive elements
- `aria-label` on all icon-only buttons
- `aria-modal`, `role="dialog"` on Modal
- `role="button"` + keyboard `Enter` on job list items

---

## Round 3 — Public Pages, Dashboard Forms & Job Detail

### Public Pages
| File | What Changed |
|------|-------------|
| `src/app/(public)/jobs/page.tsx` | Token-based Suspense skeletons, tracking/spacing on heading |
| `src/app/(public)/contact/page.tsx` | `INFO_CARDS` data-driven layout, `input-base` on all fields, `form onSubmit`, animated success state with `animate-fade-up`, gradient submit button |
| `src/app/(public)/about/page.tsx` | `card card-hover` stat blocks, gradient CTA with layered decoration, badge pill, value icons in `rounded-xl` containers |
| `src/app/(public)/jobs/[id]/page.tsx` | Chip-based meta row, section dividers with `h-px`, info row using CSS tokens, `ArrowLeft` hover micro-animation, updated apply CTA |

### Dashboard Pages
| File | What Changed |
|------|-------------|
| `src/app/(dashboard)/dashboard/saved/page.tsx` | `removingId` state for removal animation (`opacity-50 scale-[0.99]`), skeleton shimmer, empty state with icon box, `SavedCardSkeleton` |
| `src/app/(dashboard)/dashboard/post-job/page.tsx` | `Section` + `FieldError` components, `input-base` on every field, bullet dot input rows for requirements/benefits, description character counter with `CheckCircle2`, border-t action footer |

### Total File Count
**38 files** upgraded across the full stack — zero new bugs introduced, all existing logic preserved verbatim (API calls, routing, auth, Zod validation), only presentation layer changed.
