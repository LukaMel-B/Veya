# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** TravelNest
**Design System:** Monochrome Voyage
**Category:** Road Trip & Personal Travel Workspace
**Status:** Active Design System (Migrated from legacy Aurora UI to Monochrome Voyage)

---

```yaml
name: Monochrome Voyage
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  primary-charcoal: '#111111'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5e'
  secondary-carbon: '#6b6b6b'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c1a'
  on-tertiary-container: '#848481'
  stroke: '#e3e2de'
  stroke-pressed: '#d4d4d1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
```

---

## Brand & Style

This design system embodies an editorial, focused, and deeply intentional travel workspace. Inspired by personal knowledge bases and minimalist analog journals, it strips away garish travel app clutter in favor of thoughtful utility, structured breathing room, and calm clarity. It serves mindful travelers, digital nomads, and meticulous planners who view itineraries, packing systems, and field notes as an evolving craft.

The aesthetic fuses **Minimalism** with subtle **Tactile Monochromatic Editorial** cues:
- **Quiet Canvas:** Crisp pure whites and soft warm grays create high legibility without visual fatigue.
- **Graphic Precision:** High-contrast typography, strict ink-black accents, and delicate 1px borders echo classic print stationery and architectural wireframes.
- **Warm Humanity:** Expressive hand-drawn black-and-white line illustrations ground the technical clarity in whimsy, journey, and tactile warmth.
- **Intentional Interaction:** Compact pill tags, segmented switches, and rhythmic checklist elements provide confident tactile feedback on mobile screens.

## Colors

The palette is strictly grayscale, leveraging subtle tonal transitions to construct depth, hierarchy, and focus rather than saturated chromatic fills.

### Color Roles
- **Primary (`#111111`):** Deep charcoal ink used for primary headings, active toggles, critical CTA pills, and prominent graphic marks. Pure black (`#000000`) is reserved for focused tooltip badges and high-contrast metric callouts.
- **Secondary (`#6B6B6B`):** Neutral carbon used for secondary body text, metadata, subtle icon strokes, and unselected tab states.
- **Tertiary / Stroke (`#E3E2DE`):** Structural rule lines, card perimeter borders, segmented switch dividers, and inactive state outlines. A softer tone (`#D4D4D1`) is used for pressed or elevated borders.
- **Neutral Canvas / Surfaces:**
  - Base Background: Pure White (`#FFFFFF`) for global screens and elevated popover surfaces.
  - Surface Neutral 1 (`#F7F7F6`): The standard container background for cards, day-planner modules, and list groupings.
  - Surface Neutral 2 (`#F1F1EF`): Nested cards, progress track fills, inactive button surfaces, and hover/press states.
  - Surface Neutral 3 (`#EAEAEA`): Muted chips, secondary segmented controls, and metric backdrops.

## Typography

Typography relies entirely on **Inter** to construct an uncluttered, modern document hierarchy. Rhythmic scaling, balanced tracking, and careful font weight distribution eliminate the need for colored typography.

- **Headlines:** Set tightly tracked with semi-bold to bold weights. Headers evoke the confidence of modernist editorial layout, drawing instant visual anchor points to dates, destination hubs, and daily agendas.
- **Body:** Neutral, unadorned, and optimized for reading long travel guides, confirmation notes, and item checklists. Line heights remain generous to ensure relaxed vertical scanning.
- **Micro-Labels & Metadata (`label-sm`):** Rendered with uppercase styling, slight positive letter spacing (+0.06em), and a medium-to-semibold weight to frame categories, flight codes, and dates with technical accuracy.

## Layout & Spacing

The layout is built around a mobile-first fluid approach anchored by safe areas and a 4-column dynamic grid on mobile devices, scaling into centered 8-column card stages on larger viewports.

### Grid & Margins
- **Canvas Margins:** Fixed at `1.25rem` (20px) on mobile viewports to preserve ample edge breathing room while maximizing card surface area.
- **Card Gutters:** Kept at `1rem` (16px) for stacked card groups, two-column travel stat metrics, and split day schedules.
- **Internal Component Rhythm:** 
  - `space-xs` (4px): Inset badge padding, text-to-icon inline spacing.
  - `space-sm` (8px): Gaps between list title and subtitle, checklist row padding.
  - `space-md` (12px): Standard button padding, input field horizontal inset.
  - `space-lg` (20px): Inner surface card padding for itinerary modules and media containers.
  - `space-xl` (28px): Section-to-section block spacing.

## Elevation & Depth

Visual depth avoids saturated shadows or heavy drop blurs. Instead, depth is articulated through **Tonal Layering** accompanied by **Ghost Outlines** and **Micro-Ambient Floats**:

1. **Base Tier (Ground):** The underlying canvas is clean `#FFFFFF` or pale `#F7F7F6`.
2. **Container Tier (Cards & Blocks):** Containers use `#F7F7F6` or pure `#FFFFFF` bounded by a 1px solid stroke (`#E3E2DE`). No elevation shadow is applied under standard resting states.
3. **Floating & Modal Elements:** Floating tooltips, active floating pills, and sticky bottom bars utilize a subtle ambient diffused shadow (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)`) over a crisp 1px `#E3E2DE` boundary.
4. **Active/Pressed Inset:** Toggled switches, progress wells, and segmented backgrounds rely on sunken fills (`#F1F1EF` or `#EAEAEA`) without inner shadows, mimicking clean mechanical stamps.

## Shapes

The design system employs friendly, generous curves counterbalanced by razor-sharp interior typography.

- **Cards & Primary Modules:** Styled with generous corner curvature (`rounded-2xl` / 1.5rem to `rounded-3xl` / 2rem), lending travel modules an approachable, notebook-card feel.
- **Interactive Controls:** All buttons, status chips, segmented switch thumbs, and action tags use true continuous pill geometry (`rounded-full` / 9999px).
- **Checkboxes & Metric Tiles:** Sub-tiles within modular cards employ consistent soft rounding (`12px` to `16px`), ensuring cohesion with outer card envelopes.

## Components

### Buttons & Navigation Pills
- **Primary Action Button:** Full pill shape (`rounded-full`), deep ink surface (`#111111`), crisp white typography (`#FFFFFF`). Minimum height of 48px with centered icon alignment.
- **Secondary Action Button:** Surface `#FFFFFF` with a 1px `#E3E2DE` border, `#111111` typography, and soft hover transition to `#F7F7F6`.
- **Icon / Round Action Buttons:** Pure circular containers (40px or 48px) with 1px `#E3E2DE` border, white or `#F7F7F6` fill, holding 1.5px stroke icons.

### Segmented Controls & Chips
- **Segmented Control Track:** Pill-shaped background (`#F1F1EF`) housing sliding pill segments. The active tab is stark white (`#FFFFFF`) or pure black (`#111111`) with subtle border definition and bold typography.
- **Filter Chips:** Pill shapes (`rounded-full`) in white `#FFFFFF` with a 1px `#E3E2DE` border. Active chips invert to solid `#111111` fill with white text.

### Cards & Modules
- **Itinerary & Metric Cards:** Radiused between 20px and 28px, wrapped in a 1px `#E3E2DE` stroke, filled with `#F7F7F6` or pure `#FFFFFF`.
- **Nested Data Cells:** 2x2 grid tiles for daily stats (e.g., flight hours, average expenses, days remaining) featuring white surfaces inside a pale gray card body.

### Inputs, Checklists & Lists
- **Checklist Items:** Notion-inspired minimalist checklist components. Checked state reveals a rounded square (4px corner radius) filled with `#111111` featuring a white checkmark, paired with strikethrough or `#8C8C8C` muted text. Unchecked state presents a clean 1.5px border (`#D4D4D1`) on white.
- **Form Inputs:** Borderless or subtle 1px stroke inputs with light `#F7F7F6` backdrops, dark text `#111111`, and placeholder labels set in `#8C8C8C`.

### Progress & Status Indicators
- **Metric Progress Bars:** Minimal horizontal tracks with `#F1F1EF` background and solid `#111111` linear indicator.
- **Segmented Ring Gauges:** Concentric or segmented monochrome arcs using 4px–6px stroke widths, alternating between `#111111`, `#6B6B6B`, and `#E3E2DE`.

### Iconography & Illustrations
- **Icons:** Minimal 24x24 vector stroke icons rendered in 1.5px to 2px line weights with rounded stroke caps and joins.
- **Illustrations:** Expressive, hand-drawn black-and-white ink drawings that anchor travel themes (modes of transit, relaxation, packing, exploration) with organic character.

### Alerts, Modals & Native-Feel Dialogs (Alert & Dialog Library v2.4)
- **Design Philosophy:** System alert boxes (`confirm()`, `alert()`) are prohibited as they disrupt the editorial, travel-notebook aesthetic. All prompts use custom in-app modal frames (`<DialogFrame>`, `<ConfirmDialog>`, `<GlobalDialog>`).
- **Anatomy & Elevation:**
  - **Backdrop Scrim:** `rgba(0, 0, 0, 0.45)` with `backdrop-filter: blur(4px)`.
  - **Frame Radius:** `rounded-3xl` (24px curvature) with clean 1px `#E3E2DE` stroke and `shadow-xl`.
  - **Icon Pill:** 40px circular badges with semantic variants:
    - Neutral (`var(--surface-neutral-2)`)
    - Destructive Red (`#FEF2F2` / `#DC2626`)
    - Warning Amber (`#FFFBEB` / `#D97706`)
    - Success Green (`#F0FDF4` / `#16A34A`)
  - **Typography:**
    - Category Kicker: `label-micro`, tracking `0.06em`, uppercase.
    - Title Headline: `1.15rem`, weight 700, tracking `-0.02em`.
    - Body Text: `0.86rem`, weight 400, color `var(--secondary)`.
  - **3-Tier Action Button System:**
    1. **Primary Action:** Solid Black (`#0B0C0E`), crisp white text, continuous pill shape (`rounded-full` / 9999px), 44px height.
    2. **Secondary Action:** Outlined 1px `#E3E2DE` border, dark text, hover `#F7F7F6`, continuous pill shape (`rounded-full`).
    3. **Destructive Action:** High-Contrast Red (`#DC2626`), white text, continuous pill shape (`rounded-full`). Used for irreversible deletes and discard changes.
- **Platform Dismissal & Hardware Back-Button:**
  - Scrim click and Escape key cancel dialogs safely.
  - Capacitor Android hardware and gesture back-button handlers prioritize dismissing open dialogs first before popping views or closing background sheets.

