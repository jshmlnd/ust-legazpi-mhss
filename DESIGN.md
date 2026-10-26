---
name: SafeSpace
description: A calm, semi-anonymous mental-health support workspace for UST-Legazpi.
colors:
  primary: "#2A774E"
  primary-deep: "#21603F"
  green-soft: "#E7F5E9"
  green-panel: "#CFE9D6"
  canvas: "#F6F9F3"
  warm-white: "#FFFEF8"
  raised: "#FFFFFB"
  ink: "#161D1A"
  ink-soft: "#4A5551"
  line: "#D7E5D9"
typography:
  display:
    fontFamily: "KG Second Chances, cursive"
    fontSize: "clamp(2rem, 4vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.05
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
spacing:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.sm}"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.warm-white}"
    rounded: "{rounded.md}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.warm-white}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
---

# Design System: SafeSpace

## Overview

**Creative North Star: "SafeSpace"**

SafeSpace is a calm, layered workspace rather than a dark dashboard. Soft green establishes the emotional ground: nature, healing, balance, and relaxation. Warm white surfaces create the open, non-threatening field where support tasks can be read and completed without visual pressure.

The system is layered and airy. Navigation, cards, forms, lists, maps, and charts share one quiet surface language, while the active route indicator gives every screen a sense of orientation. Status colors remain available only when they carry functional meaning.

**Key Characteristics:**
- Soft green ground with warm-white work surfaces.
- Deep evergreen ink and restrained borders.
- Gentle ambient elevation, never hard offset shadows.
- Rounded 12–16px surfaces and touch-friendly controls.
- Clear route cues for current location and next action.

## Colors

The palette keeps the emotional environment green and warm while reserving semantic colors for states that need distinction.

### Primary
- **Evergreen primary** (#2A774E): Primary actions, active routes, focus, and meaningful progress.
- **Evergreen deep** (#21603F): Hover states, selected map markers, and high-contrast green text.

### Secondary
- **Soft leaf** (#E7F5E9): Active navigation, badges, selected states, and gentle callouts.
- **Panel green** (#CFE9D6): Navigation rail and brand surfaces.

### Neutral
- **Canvas green** (#F6F9F3): Page background and breathing room.
- **Warm white** (#FFFEF8): Cards, forms, tables, and primary reading surfaces.
- **Raised white** (#FFFFFB): Modals, popovers, and elevated controls.
- **Evergreen ink** (#161D1A): Headings and high-priority text.
- **Soft ink** (#4A5551): Body copy and supporting text.
- **Quiet line** (#D7E5D9): Borders, dividers, and chart guides.

### Named Rules
**The Safe Route Rule.** Every page makes the current location and next useful action obvious without relying on decoration.

## Typography

**Display Font:** KG Second Chances (with cursive fallback)

**Body Font:** ui-sans-serif, system-ui, sans-serif

**Character:** The body voice is practical and calm. The display face appears only where the SafeSpace identity benefits from a personal, human touch, never inside dense operational content.

### Hierarchy
- **Display** (regular, clamp 2rem–3.75rem, 1.05): Login and identity moments.
- **Headline** (600, 1.5rem–1.875rem, 1.15): Page titles and primary tasks.
- **Title** (600, 0.875rem–1rem, 1.3): Card and section headings.
- **Body** (400, 0.875rem, 1.6): Explanations and task content, constrained to readable measures.
- **Label** (600, 0.75rem, 1.3): Metadata, form labels, and status text.

## Layout

- Desktop uses a fixed soft-green navigation rail and a flexible work canvas.
- Content sits in a centered `max-w-7xl` container with generous vertical breathing room.
- Page headers place the title and primary action before supporting panels.
- Mobile collapses navigation into a drawer and keeps primary controls above the fold.
- Data-heavy screens use warm-white panels with clear internal dividers rather than nested card stacks.

## Elevation & Depth

Elevation is layered and airy. A warm-white panel lifts from the soft-green canvas with a low-opacity evergreen shadow and a quiet border. Stronger elevation is reserved for modals, menus, and transient overlays. Blur is not used as decoration.

## Shapes

Cards and field sheets use 16px corners. Inputs and buttons use 12px corners. Status badges may use pill geometry because their compact shape communicates state. Borders remain 1px and green-tinted.

## Components

- **Navigation rail:** soft green ground, warm-white active item, evergreen route marker, grouped labels, and a calm footer identity block.
- **Page header:** a single evergreen route bar, clear title, supporting description, and actions aligned with the task.
- **Card:** warm-white surface, quiet border, low ambient shadow, and optional pale-green header wash.
- **Button:** evergreen primary action, warm-white secondary action, clear focus ring, and 40–44px target height.
- **Input:** warm-white field, green-tinted border, generous padding, and an evergreen focus ring.
- **Modal:** raised warm-white panel over an evergreen-tinted scrim with protected focus.
- **Status badge:** semantic tone, compact label, and a small dot for quick scanning.

## Do's and Don'ts

- Do preserve the student's sense of privacy and control.
- Do use green as structure, not decoration scattered across every surface.
- Do keep warm white as the default reading ground.
- Do reserve amber, red, and blue for states with real meaning.
- Do keep focus, error, loading, empty, and disabled states visible.
- Don't reintroduce black or dark theme surfaces.
- Don't use heavy gradients, glass effects, or hard offset shadows.
- Don't bury the primary action below a wall of equal-weight cards.
- Don't use the display typeface for dense data or form labels.
