---
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
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1c1a'
  on-tertiary-container: '#848481'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e3e2de'
  tertiary-fixed-dim: '#c7c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#464744'
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
---

# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
>
> If that file exists, its rules **override** this Design file.
>
> If not, strictly follow the rules below.

---

- **Project:** TravelNest
- **Generated:** 2026-10-09 20:00:35
- **Category:** Road Trip Planner

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

# Monochrome Voyage: card and item spacing

Spacing-only stylesheet for cards and the items inside them. It follows the **Layout & Spacing** section of the Monochrome Voyage `design.md`.

| Token | Size |
| --- | --- |
| gutter | 16px |
| margin | 20px |
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 20px |
| xl | 28px |

## Usage

Import it from your globals file, after Tailwind, so the classes sit in the right layer and utilities such as `p-0` or `gap-2` can still override them:

```css
@import "tailwindcss";
@import "./spacing.css";
```

Every value reads the theme's `--space-*`, `--gutter` and `--margin` variables and falls back to the `design.md` number, so the file also works on its own.

## Class cheat sheet

| Where | Classes | Spacing |
| --- | --- | --- |
| Padding inside a card | `.card-pad`, `.card-pad-compact`, `.card-pad-roomy` | 20px, 12px, 28px |
| Full-bleed media | `.card-bleed`, `.card-bleed-top`, `.card-bleed-bottom` | Cancels the card padding so media runs edge to edge |
| Between cards | `.card-group` | 16px gap, stacked vertically |
| Stat tiles | `.card-grid`, `.card-grid-3`, `.card-grid-4`, `.card-grid-compact` | 2, 3 or 4 columns with a 16px gap; compact uses 12px |
| Vertical stack | `.stack`, `.stack-xs`, `.stack-sm`, `.stack-md`, `.stack-lg`, `.stack-xl` | 12px by default; 4, 8, 12, 20, 28px |
| Horizontal, wraps | `.cluster`, `.cluster-xs`, `.cluster-md` | 8px; 4px; 12px |
| Header row | `.split` | Space-between, 12px gap |
| Icon next to text | `.icon-label` | 4px |
| Title and subtitle | `.title-group`, `.title-group-tight` | 8px; 4px |
| Lists of rows | `.item-list`, `.item-list-tight`, `.item-list-roomy` | 8px; 4px; 12px |
| Checklist | `.checklist`, `.checklist-item` | 8px row padding, 12px checkbox to text |
| Sections inside a card | `.card-section` | 20px between sections |
| Nested tiles | `.cell-pad` | 12px padding |
| Controls and badges | `.control-pad`, `.badge-pad` | 8px by 12px; 4px by 8px |
| Page | `.page-pad`, `.section-stack` | 20px side margin; 28px between sections |

## Variables

Everything is controlled by these variables on `:root`. Change one value to retune every class that uses it.

### Card padding

| Variable | Default | Used for |
| --- | --- | --- |
| `--card-padding` | `var(--space-lg, 1.25rem)` | 20px, inner surface padding |
| `--card-padding-compact` | `var(--space-md, 0.75rem)` | 12px |
| `--card-padding-roomy` | `var(--space-xl, 1.75rem)` | 28px |

### Between cards

| Variable | Default | Used for |
| --- | --- | --- |
| `--card-group-gap` | `var(--gutter, 1rem)` | 16px, stacked cards |
| `--grid-gap` | `var(--gutter, 1rem)` | 16px, stat tiles and day schedules |
| `--grid-gap-compact` | `var(--space-md, 0.75rem)` | 12px, tiles nested inside a card |

### Between items inside a card

| Variable | Default | Used for |
| --- | --- | --- |
| `--card-gap` | `var(--space-md, 0.75rem)` | 12px, blocks inside a card |
| `--card-section-gap` | `var(--space-lg, 1.25rem)` | 20px, section to section inside a card |
| `--item-gap` | `var(--space-sm, 0.5rem)` | 8px, rows in a list |
| `--title-gap` | `var(--space-sm, 0.5rem)` | 8px, list title to subtitle |
| `--inline-gap` | `var(--space-xs, 0.25rem)` | 4px, icon to label |
| `--chip-gap` | `var(--space-sm, 0.5rem)` | 8px, chips and tags |
| `--check-gap` | `var(--space-md, 0.75rem)` | 12px, checkbox to text |
| `--check-row-padding` | `var(--space-sm, 0.5rem)` | 8px, checklist row padding |
| `--cell-padding` | `var(--space-md, 0.75rem)` | 12px, nested data cells |

### Controls and badges

| Variable | Default | Used for |
| --- | --- | --- |
| `--control-padding-x` | `var(--space-md, 0.75rem)` | 12px, button padding and input inset |
| `--control-padding-y` | `var(--space-sm, 0.5rem)` | - |
| `--badge-padding-x` | `var(--space-sm, 0.5rem)` | - |
| `--badge-padding-y` | `var(--space-xs, 0.25rem)` | 4px, badge inset |

### Page

| Variable | Default | Used for |
| --- | --- | --- |
| `--page-margin` | `var(--margin, 1.25rem)` | 20px, canvas margin |
| `--section-gap` | `var(--space-xl, 1.75rem)` | 28px, section to section |

## Full stylesheet

`spacing.css`

```css
/* ==========================================================================
   Monochrome Voyage: card and item spacing
   Source: design.md "Layout & Spacing"
     gutter 16px | margin 20px | xs 4px | sm 8px | md 12px | lg 20px | xl 28px

   Use it from your globals file, after Tailwind, so the classes sit in the
   right layer and utilities such as p-0 or gap-2 can still override them:

     @import "tailwindcss";
     @import "./spacing.css";

   Every value reads the theme's --space-* / --gutter / --margin variables and
   falls back to the design.md number, so the file also works on its own.

   CLASS CHEAT SHEET
   Padding inside a card   .card-pad  .card-pad-compact  .card-pad-roomy
   Full-bleed media        .card-bleed  .card-bleed-top  .card-bleed-bottom
   Between cards           .card-group  .card-grid  .card-grid-3  .card-grid-4  .card-grid-compact
   Between items in a card .stack  .stack-xs|sm|md|lg|xl   (vertical)
                           .cluster  .cluster-xs|md        (horizontal, wraps)
                           .split                          (header row, space-between)
                           .icon-label                     (icon next to text)
                           .title-group  .title-group-tight
                           .item-list  .item-list-tight  .item-list-roomy
                           .checklist  .checklist-item
                           .card-section                   (blocks separated inside a card)
   Nested tiles            .cell-pad
   Controls and badges     .control-pad  .badge-pad
   Page                    .page-pad  .section-stack
   ========================================================================== */

:root {
  /* Card padding */
  --card-padding: var(--space-lg, 1.25rem);          /* 20px, inner surface padding */
  --card-padding-compact: var(--space-md, 0.75rem);  /* 12px */
  --card-padding-roomy: var(--space-xl, 1.75rem);    /* 28px */

  /* Between cards */
  --card-group-gap: var(--gutter, 1rem);             /* 16px, stacked cards */
  --grid-gap: var(--gutter, 1rem);                   /* 16px, stat tiles and day schedules */
  --grid-gap-compact: var(--space-md, 0.75rem);      /* 12px, tiles nested inside a card */

  /* Between items inside a card */
  --card-gap: var(--space-md, 0.75rem);              /* 12px, blocks inside a card */
  --card-section-gap: var(--space-lg, 1.25rem);      /* 20px, section to section inside a card */
  --item-gap: var(--space-sm, 0.5rem);               /* 8px, rows in a list */
  --title-gap: var(--space-sm, 0.5rem);              /* 8px, list title to subtitle */
  --inline-gap: var(--space-xs, 0.25rem);            /* 4px, icon to label */
  --chip-gap: var(--space-sm, 0.5rem);               /* 8px, chips and tags */
  --check-gap: var(--space-md, 0.75rem);             /* 12px, checkbox to text */
  --check-row-padding: var(--space-sm, 0.5rem);      /* 8px, checklist row padding */
  --cell-padding: var(--space-md, 0.75rem);          /* 12px, nested data cells */

  /* Controls and badges */
  --control-padding-x: var(--space-md, 0.75rem);     /* 12px, button padding and input inset */
  --control-padding-y: var(--space-sm, 0.5rem);
  --badge-padding-x: var(--space-sm, 0.5rem);
  --badge-padding-y: var(--space-xs, 0.25rem);       /* 4px, badge inset */

  /* Page */
  --page-margin: var(--margin, 1.25rem);             /* 20px, canvas margin */
  --section-gap: var(--space-xl, 1.75rem);           /* 28px, section to section */
}

@layer components {
  /* ----------------------------------------------------------------------
     1. Padding inside a card
     Each class sets --card-pad-current so .card-bleed can cancel it exactly.
     ---------------------------------------------------------------------- */
  .card-pad         { --card-pad-current: var(--card-padding); }
  .card-pad-compact { --card-pad-current: var(--card-padding-compact); }
  .card-pad-roomy   { --card-pad-current: var(--card-padding-roomy); }

  .card-pad,
  .card-pad-compact,
  .card-pad-roomy {
    padding: var(--card-pad-current);
  }

  /* Media or a divider that runs edge to edge inside a padded card */
  .card-bleed {
    margin-inline: calc(-1 * var(--card-pad-current, var(--card-padding)));
  }
  .card-bleed-top {
    margin-inline: calc(-1 * var(--card-pad-current, var(--card-padding)));
    margin-block-start: calc(-1 * var(--card-pad-current, var(--card-padding)));
  }
  .card-bleed-bottom {
    margin-inline: calc(-1 * var(--card-pad-current, var(--card-padding)));
    margin-block-end: calc(-1 * var(--card-pad-current, var(--card-padding)));
  }

  /* ----------------------------------------------------------------------
     2. Between cards
     ---------------------------------------------------------------------- */
  .card-group {
    display: flex;
    flex-direction: column;
    gap: var(--card-group-gap);
  }

  /* Stat tiles: two columns by default, as in the 2x2 data cells */
  .card-grid,
  .card-grid-3,
  .card-grid-4,
  .card-grid-compact {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--grid-gap);
  }
  .card-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .card-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .card-grid-compact { gap: var(--grid-gap-compact); }

  /* ----------------------------------------------------------------------
     3. Between items inside a card
     Each class sets its own gap variable, so a nested stack never inherits
     the gap of the stack around it.
     ---------------------------------------------------------------------- */

  /* Vertical rhythm: .stack is the card default (12px) */
  .stack,
  .stack-xs,
  .stack-sm,
  .stack-md,
  .stack-lg,
  .stack-xl {
    display: flex;
    flex-direction: column;
    gap: var(--stack-gap);
  }
  .stack     { --stack-gap: var(--card-gap); }
  .stack-xs  { --stack-gap: var(--space-xs, 0.25rem); }
  .stack-sm  { --stack-gap: var(--space-sm, 0.5rem); }
  .stack-md  { --stack-gap: var(--space-md, 0.75rem); }
  .stack-lg  { --stack-gap: var(--space-lg, 1.25rem); }
  .stack-xl  { --stack-gap: var(--space-xl, 1.75rem); }

  /* Chips, tags and filter pills: horizontal, wraps onto new lines */
  .cluster,
  .cluster-xs,
  .cluster-md {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cluster-gap);
  }
  .cluster    { --cluster-gap: var(--chip-gap); }
  .cluster-xs { --cluster-gap: var(--space-xs, 0.25rem); }
  .cluster-md { --cluster-gap: var(--space-md, 0.75rem); }

  /* Header row: title on one side, action or value on the other */
  .split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md, 0.75rem);
  }

  /* Icon next to its label */
  .icon-label {
    display: inline-flex;
    align-items: center;
    gap: var(--inline-gap);
  }

  /* Title with its subtitle or metadata underneath */
  .title-group,
  .title-group-tight {
    display: flex;
    flex-direction: column;
    gap: var(--title-group-gap);
    min-width: 0;
  }
  .title-group       { --title-group-gap: var(--title-gap); }
  .title-group-tight { --title-group-gap: var(--space-xs, 0.25rem); }

  /* Plain lists of rows */
  .item-list,
  .item-list-tight,
  .item-list-roomy {
    display: flex;
    flex-direction: column;
    gap: var(--list-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .item-list       { --list-gap: var(--item-gap); }
  .item-list-tight { --list-gap: var(--space-xs, 0.25rem); }
  .item-list-roomy { --list-gap: var(--space-md, 0.75rem); }

  /* Checklist: row padding gives the rhythm, so the list itself has no gap */
  .checklist {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .checklist-item {
    display: flex;
    align-items: center;
    gap: var(--check-gap);
    padding-block: var(--check-row-padding);
  }

  /* Blocks separated inside one card (use where .stack is not wrapping them) */
  .card-section + .card-section {
    margin-block-start: var(--card-section-gap);
  }

  /* Tiles nested inside a card body */
  .cell-pad {
    padding: var(--cell-padding);
  }

  /* ----------------------------------------------------------------------
     4. Controls and badges
     ---------------------------------------------------------------------- */
  .control-pad {
    padding-block: var(--control-padding-y);
    padding-inline: var(--control-padding-x);
  }
  .badge-pad {
    padding-block: var(--badge-padding-y);
    padding-inline: var(--badge-padding-x);
  }

  /* ----------------------------------------------------------------------
     5. Page
     ---------------------------------------------------------------------- */
  .page-pad {
    padding-inline: var(--page-margin);
  }
  .section-stack {
    display: flex;
    flex-direction: column;
    gap: var(--section-gap);
  }
}
```

---

## 10. Alert & Dialog Component Library (v2.4 - Monochrome Voyage)

### Master Component Anatomy (`<DialogFrame>`)

The Alert & Dialog Component Library provides standardized, implementation-ready modal dialogs, alerts, sheets, and decision prompts designed for TravelNest across Android Native and PWA. It strictly follows neutral surface layers, inter typography, pill geometry, and explicit 3-tier action hierarchy: Solid Black Primary, Outlined Secondary, and High-Contrast Red Destructive.

```
┌─────────────────────────────────────────────────────────────┐
│  Backdrop Scrim: rgba(0,0,0,0.45), blur(4px)                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ [Icon Pill 40px]                          [Dismiss] │   │
│   │                                                     │   │
│   │ CATEGORY KICKER (Tracking 0.06em, Bold Uppercase)   │   │
│   │ Dialog Title Headline (1.15rem, Bold)               │   │
│   │ Dialog descriptive explanatory copy (0.86rem)       │   │
│   │                                                     │   │
│   │ ┌─────────────────────────────────────────────────┐ │   │
│   │ │ Content Slot: Warning / Card / Form / Progress  │ │   │
│   │ └─────────────────────────────────────────────────┘ │   │
│   │                                                     │   │
│   │             [Secondary Cancel] [Primary Confirm]    │   │
│   │             or [High-Contrast Red Destructive]      │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Slot Hierarchy
1. **Backdrop / Scrim (`.dialog-backdrop`):** `rgba(0, 0, 0, 0.45)`, `backdrop-filter: blur(4px)`, `z-index: 99999`. Tap-to-dismiss support with smooth 180ms ease fade.
2. **Container (`.dialog-frame`):** `rounded-3xl` (24px radius), `max-width: 440px` (mobile-first), `background: #ffffff` (Light) / `#161616` (Dark), `border: 1px solid var(--stroke)`, `shadow-xl` (`box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`).
3. **Header Slot:**
   - **Icon Pill (`.dialog-icon-pill`):** 40x40px circle container with 20px vector icon. Variants:
     - `neutral`: `var(--surface-neutral-2)` bg, `var(--primary)` icon.
     - `destructive`: `#FEF2F2` bg, `#DC2626` icon.
     - `warning`: `#FFFBEB` bg, `#D97706` icon.
     - `success`: `#F0FDF4` bg, `#16A34A` icon.
   - **Category Kicker (`.dialog-kicker`):** `label-micro`, tracking `0.06em`, uppercase, `color: var(--secondary)`.
   - **Dismiss Button:** 28x28px circle button, 14px close icon, neutral hover state.
4. **Content Slot:**
   - **Title Headline (`.dialog-title`):** `1.15rem`, weight 700, tracking `-0.02em`, `color: var(--primary)`.
   - **Body Copy (`.dialog-body`):** `0.86rem`, weight 400, line-height 1.5, `color: var(--secondary)`.
   - **Warning Callout (`.dialog-callout-warning`):** `#FEF2F2` background, `#FEE2E2` border, `#B91C1C` text, paired with `AlertTriangle` icon.
   - **Detail Card (`.dialog-callout-info`):** `var(--surface-neutral-1)` background, `1px solid var(--stroke)`, `rounded-xl` (12px).
5. **Action Slot (`.dialog-actions`):** Max 3-action buttons:
   - **Primary Action (`.btn-dialog-primary`):** Solid Black (`#0B0C0E`), white text, `border-radius: 9999px` (pill), height 44px, weight 600.
   - **Secondary Action (`.btn-dialog-secondary`):** Surface `#ffffff`, border `1px solid var(--stroke)`, color `var(--primary)`, hover `var(--surface-neutral-2)`, `border-radius: 9999px`.
   - **Destructive Action (`.btn-dialog-destructive`):** High-Contrast Red (`#DC2626`), white text, `border-radius: 9999px`. Hover `#B91C1C`.

### Implementation Variants & Use Cases
1. **01 — Standard Alert:** Informational dismissal with single solid button (e.g., *Itinerary Offline Cache Ready*).
2. **02 — Confirmation:** Primary + Secondary actions (e.g., *Export WhatsApp Itinerary Schedule?*).
3. **03 — Destructive Action:** High-Contrast Red primary action paired with neutral secondary (e.g., *Delete Trip "Swiss Alps Hiking"?*).
4. **04 — Warning:** Warning icon pill and callout for schedule conflicts (e.g., *Overlapping Itinerary Slot*).
5. **05 — Success:** Green icon pill with action to view newly confirmed ticket (e.g., *Flight Booking Confirmed*).
6. **06 — Error Recovery:** Red badge with retry / dismiss actions (e.g., *Unable to Sync Hotel Booking*).
7. **07 — Field Entry:** Inline form fields inside modal card (e.g., *Edit Collection Name*).
8. **11 — Unsaved Changes (Guard Sheet):** 3-button guard for dirty forms: `Save & Close` (Primary), `Continue Editing` (Secondary), and `Discard Changes` (Destructive Red).
9. **12 — Async Progress:** Live status counter with *Run in Background* option (e.g., *Syncing Kyoto Metro Maps...*).

### Platform & Dismissal Guarantees
- **Escape Key:** Global `keydown` handler on `window` cancels active dialog.
- **Backdrop Scrim Tap:** Dismisses dialog safely unless explicit `preventBackdropClose` is set.
- **Android Native Back-Button:** Top of the back-button listener cascade in `App.tsx` checks `isDialogOpen` and calls `closeActiveDialog(false)` before any sheet closing or route popping.
- **Zero Built-in Alert Boxes:** Zero usage of native `window.alert()` or `window.confirm()`. All flows use `showConfirm()` or `showAlert()`.

---

## 11. Interactive Spotlight Tour Specification (v2.5 - Monochrome Voyage)

### Master Spotlight Anatomy

The Interactive Spotlight Tour introduces travelers to TravelNest using an optically pure cutout mask that keeps the live interface visible while guiding attention with laser precision.

```
┌─────────────────────────────────────────────────────────────┐
│  SVG Mask Scrim: rgba(11, 12, 14, 0.72)                     │
│                                                             │
│         ┌───────────────────────┐                           │
│         │ Live UI Target Cutout │ <── rx="16", pure hole    │
│         │ [ + New Trip Button ] │ <── stroke="#FFFFFF" ring │
│         └───────────┬───────────┘                           │
│                     │ 14px Speech-Bubble Pointer Tail       │
│         ┌───────────▼─────────────────────────────────────┐ │
│         │ [CATEGORY BADGE]                         [ X ]  │ │
│         │ Step Title Headline                             │ │
│         │ Conversational travel-companion description...  │ │
│         │ ┌─────────────────────────────────────────────┐ │ │
│         │ │ ✨ Helpful contextual tip or shortcut       │ │ │
│         │ └─────────────────────────────────────────────┘ │ │
│         │ ••••••• [Back] [Next / Finish]                  │ │
│         └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Tokens & Visual Hierarchy
1. **Backdrop Scrim:** Full-bleed SVG `<mask id="travelnest-spotlight-mask">` with `<rect fill="#000000" rx="16">` hole, filled with `rgba(11, 12, 14, 0.72)`.
2. **Highlight Ring:** `<rect fill="none" stroke="#FFFFFF" strokeWidth="2.5">` with drop-shadow filter and gentle 2.4s ease-in-out breathing glow.
3. **Dialogue Card:** `max-width: 380px`, `background: #FFFFFF`, `border-radius: 22px`, `padding: 18px 20px`, `box-shadow: 0 20px 48px rgba(0, 0, 0, 0.28)`.
4. **Speech-Bubble Tail:** 14x14px diamond rotated 45°, positioned dynamically at `top: -7px` (for cards below target) or `bottom: -7px` (for cards above target), aligned with target center and clamped to card margins.
5. **Progress Dots:** 5px height capsule indicators (`width: 16px` active, `width: 5px` inactive, transition 180ms ease).
6. **Actions:** Pill buttons with 9999px border radius (Primary: `#0B0C0E` / white text; Secondary: surface white with `var(--stroke)` border).
7. **Collision Avoidance:** Automatically computes available screen clearance; positions card above bottom navigation targets, below top headers, and safely centers with graceful fallback if a target is unmounted.