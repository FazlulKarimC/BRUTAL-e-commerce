# Neo-Brutalism Design System

> **Read this before touching any UI.** Every component must follow these rules. No exceptions.

---

## Colors — 4 Only

| Name | Hex | Tailwind | Role |
|------|-----|----------|------|
| Yellow | `#FACC15` | `yellow-400` | Accent, hero bg, hover states, highlights, badges |
| Red | `#EF4444` | `red-500` | CTAs, sale badges, destructive actions, urgency |
| Black | `#000000` | `black` | Borders, shadows, text, dark buttons |
| White | `#FAFAFA` / `#FFF` | — | Page backgrounds (`bg-[#FAFAFA]`), cards (`bg-white`) |

**Semantic exception:** `green-500` (`#22C55E`) is allowed **only** for status indicators (delivered, success, valid states). Never for CTAs or branding.

❌ No blue, purple, gradients, or opacity-based colors.

---

## Typography

| Font | Variable | Usage |
|------|----------|-------|
| DM Sans | `--font-dm-sans` | Body text, UI elements (default `font-sans`) |
| Space Grotesk | `--font-space-grotesk` | Headings, hero text, prices |
| Space Mono | `--font-space-mono` | Badges, tags, monospace accents |

**Scale:**
- Hero: `text-5xl md:text-7xl font-black`
- Section: `text-3xl md:text-4xl font-black uppercase`
- Card: `text-xl font-bold`
- Body: `text-base leading-relaxed`
- Badge: `text-xs font-bold uppercase tracking-wider`

---

## Borders, Shadows & Radius

### Borders — Always solid, always black, always thick.
```
Primary:   border-4 border-black    (cards, buttons, inputs)
Secondary: border-2 border-black    (thumbnails, inner borders)
```
❌ Never `border-dashed`, `border-dotted`, or `border` (1px).

### Shadows — Hard offset only. No blur. Ever.
```
Small:    shadow-[2px_2px_0px_#000]     (pressed/active state)
Default:  shadow-[4px_4px_0px_#000]     (cards, buttons at rest)
Large:    shadow-[6px_6px_0px_#000]     (emphasized elements)
XL:       shadow-[8px_8px_0px_#000]     (hover states, hero, modals)
```
❌ Never `shadow-sm`, `shadow-md`, `shadow-lg` (these use blur).

### Radius
```
rounded-md   (8px)   — small buttons, badges
rounded-lg   (12px)  — inputs, buttons
rounded-xl   (16px)  — cards, containers
rounded-full         — avatars only
```

---

## Interaction States — The 3-State Rule

Every interactive element must implement **all 3 states**:

| State | Transform | Shadow | Effect |
|-------|-----------|--------|--------|
| **Rest** | `translate(0,0)` | `4px 4px 0px #000` | Baseline |
| **Hover** | `-translate-x-1 -translate-y-1` | `8px 8px 0px #000` | Lifts UP, shadow expands |
| **Active/Click** | `translate-x-0 translate-y-0` | `2px 2px 0px #000` | Presses DOWN, shadow contracts |

### Copy-paste pattern:
```tsx
className="shadow-[4px_4px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#000] transition-all duration-200"
```

❌ Never hover DOWN (positive translate). Never hover without active state.

---

## Animation Tokens

Defined in `globals.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--dur-fast` | `80ms` | Instant feedback |
| `--dur-snap` | `150ms` | Pop/bounce |
| `--dur-normal` | `250ms` | Standard transitions |

### Keyframes available:
- `animate-brutal-shake` — Input error feedback
- `animate-brutal-bounce` — Add-to-cart confirmation
- `animate-brutal-pop` — Badge count updates

All animations auto-disabled via `@media (prefers-reduced-motion: reduce)`.

---

## Component Patterns

### Button (use `<Button>` from `components/ui/button.tsx`)
```tsx
<Button>Default</Button>                    // Black bg, yellow shadow
<Button variant="yellow">Accent</Button>    // Yellow bg
<Button variant="outline">Outline</Button>  // White bg, black border
<Button variant="ghost">Ghost</Button>      // No border
```

### Card (use `<Card>` from `components/ui/card.tsx`)
```tsx
<Card shadow="md">              // shadow-[4px_4px_0px_#000]
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Input (use `<Input>` from `components/ui/input.tsx`)
```tsx
<Input />                          // Default: brutal variant
<Input state="error" />            // Red border + shake
<Input state="success" />          // Green border
```
Focus state: border shifts to yellow (`#FACC15`) + shadow shifts to yellow.

### Badge
```tsx
// Rotated for "hand-stamped" feel
<span className="bg-[#FACC15] text-black font-mono text-xs font-bold px-3 py-1 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] -rotate-2">
  NEW
</span>
```

---

## Page Backgrounds

- All pages: `bg-[#FAFAFA]` (not `bg-gray-50` — these differ in Tailwind 4)
- Cards: `bg-white`
- Hero sections: `bg-[#FACC15]` or `bg-black`

---

## Spacing

- Section padding: `py-16 md:py-24`
- Card padding: `p-4` to `p-6`
- Gaps: use `gap-*` (not margins)
- Container: `container mx-auto px-4`

---

## Responsive Rules

- Mobile-first (no prefix = mobile)
- Product grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Min touch target: `44px` (`h-11`)
- Nav: `hidden md:flex` for desktop, hamburger for mobile

---

## Hard Rules

| ✅ Always | ❌ Never |
|-----------|---------|
| `border-4 border-black` on interactive elements | Blurred shadows (`shadow-lg`) |
| Hard offset shadows | Gradients |
| Solid borders | Dashed/dotted borders |
| `bg-[#FAFAFA]` for page backgrounds | `bg-gray-50` or other Tailwind grays |
| Lift-UP on hover | Press-DOWN on hover |
| Active/pressed state on all buttons | Hover-only without active |
| 4-color palette + green exception | Blue, purple, or unauthorized colors |
| `duration-200` for transitions | `duration-500` or slower |
| Image hover: `scale-[1.03] duration-300` | `scale-110` or higher |
| `prefers-reduced-motion` respect | Ignoring a11y preferences |

---

*Last updated: March 2025*
