# IBMS Frontend Implementation Guide

## Purpose

This document explains how the frontend will be built for the Ice Business Management System.

It is a practical working guide for:

- application structure
- page planning
- styling direction
- motion rules
- API integration patterns
- dashboard rollout order

The frontend must reflect the backend that already exists in AquaFlow and should stay aligned with the backend modules instead of becoming a disconnected UI project.

## Core Stack

The frontend will use:

- React
- Vite
- TypeScript
- Tailwind CSS

Recommended supporting tools:

- React Router
- TanStack Query
- Axios
- Framer Motion
- Recharts

## Frontend Principles

We will build the frontend around these rules:

1. keep the UI operational and clear
2. prefer reusable layout blocks over page-by-page redesign
3. align screens to backend modules
4. keep state management simple
5. use motion to support understanding, not decoration
6. design mobile and desktop views intentionally from the start

## Backend Alignment

The backend already defines the real product structure. The frontend should follow that structure directly.

### Main app areas

- Overview Dashboard
- Business
- Inventory
- Production
- Workforce
- Compliance
- Sales
- Finance
- Settings and Profile

### Backend-informed dashboard content

From the backend docs, the dashboard should prioritize:

- stock visibility
- machine and maintenance visibility
- attendance and workforce visibility
- compliance status visibility
- order and delivery visibility
- finance snapshot visibility

This means the dashboard is not just decorative. It should act as the main operational summary for the company.

## Application Structure

Recommended source structure after scaffolding:

```text
src/
  app/
    providers/
    router/
  components/
    charts/
    dashboard/
    forms/
    layout/
    tables/
    ui/
  features/
    auth/
    business/
    compliance/
    dashboard/
    finance/
    inventory/
    production/
    sales/
    workforce/
  lib/
    api/
    utils/
  pages/
  styles/
  types/
```

## Routing Direction

Recommended route plan:

- `/login`
- `/`
- `/business`
- `/inventory`
- `/production`
- `/workforce`
- `/compliance`
- `/sales`
- `/finance`
- `/settings/profile`

The root route `/` should be the overview dashboard.

## Layout System

The app should use one consistent shell:

- left sidebar for module navigation
- top bar for page title, search, notifications, and profile access
- main content area with responsive spacing
- reusable page header block
- reusable section cards

### Layout goals

- fast scanning
- clear hierarchy
- strong spacing rhythm
- minimal clutter
- no overcrowded widgets

## Theme Direction

Approved design direction: cold industrial

### Color mood

- deep navy for major surfaces
- steel blue for structure
- ice cyan for highlights and active states
- fog gray for soft backgrounds
- emerald for healthy or positive metrics
- amber for warnings
- red-orange for urgent problems

### Theme character

The UI should feel:

- sharp
- modern
- slightly premium
- operational
- calm under heavy information

It should not feel:

- playful
- overly glossy
- generic SaaS purple
- crowded or overly dark

## Typography Direction

Recommended approach:

- a strong display or heading font for section titles
- a clean, highly readable sans-serif for UI text

Typography should help distinguish:

- dashboard headline moments
- KPI numbers
- table and form text
- alert labels

## Motion System

Motion should be subtle, deliberate, and useful.

### Approved motion patterns

- page sections reveal with fade and slight upward movement
- cards enter with staggered timing
- charts animate on first view
- drawers and overlays use soft blur plus slide/fade transitions
- hover states slightly lift interactive cards
- only critical alerts get pulse or glow emphasis

### Timing guidance

- hover interactions: `180ms` to `220ms`
- panel transitions: `240ms` to `320ms`
- page or section entry: `320ms` to `450ms`

### Motion rules

- no constant floating animations
- no distracting looping effects
- no exaggerated bounce
- respect reduced motion preferences

## View Effects

The dashboard should use a few intentional visual effects:

- soft gradient header area
- subtle grid or texture in the background
- lightly frosted metric cards
- thin borders and clean shadow separation
- sticky summary areas where useful
- blur-backed overlays for modal and drawer interactions

These effects should improve atmosphere without harming readability.

## Dashboard Plan

The first dashboard should be simple and strong.

### First screen sections

- top greeting and overview header
- KPI summary cards
- operational alerts panel
- module quick-access cards
- charts section
- recent activity feed

### Suggested KPI cards

- total stock items
- low stock alerts
- active machines
- maintenance due
- staff present today
- pending compliance actions
- orders in progress
- recent finance snapshot

### Suggested alert groups

- reorder alerts
- overdue maintenance
- expiring licenses
- pending safety or hygiene checks
- overdue deliveries

### Suggested quick links

- Inventory
- Production
- Workforce
- Compliance
- Sales
- Finance

## Data Integration Direction

The frontend should integrate with the backend through a clear API layer.

### API principles

- one shared API client
- feature-based query hooks
- typed request and response models where practical
- centralized auth and CSRF handling
- consistent error display

### Auth notes from the backend

The backend uses cookie-based JWT authentication with CSRF protection.

The frontend should therefore support this browser flow:

1. request CSRF token
2. submit login with `X-CSRFToken`
3. let the browser store auth cookies
4. refresh CSRF token when required for write actions

This should be built into the API client and auth feature so pages do not repeat that logic.

## Reusable UI Primitives

We should establish a small reusable UI layer early:

- button
- input
- select
- badge
- card
- table
- section header
- stat card
- alert row
- empty state
- loading state

This will help module pages grow faster after the dashboard.

## Responsive Strategy

The app must work well on desktop first, but remain usable on tablet and mobile.

### Desktop

- persistent sidebar
- multi-column dashboard sections
- wider table views

### Tablet

- collapsible sidebar
- two-column sections where space allows

### Mobile

- stacked sections
- horizontal scroll for dense KPI rows if needed
- simplified chart sizing
- sticky action areas only when they add value

## Implementation Order

Recommended order of work:

1. scaffold React Vite TypeScript project
2. install and configure Tailwind CSS
3. create theme tokens and base styles
4. set up router and app shell
5. implement auth foundation
6. build dashboard layout and reusable cards
7. connect dashboard with backend-ready API patterns
8. expand module screens one module at a time

## First Frontend Deliverables

The first implementation pass should produce:

- project scaffold
- theme foundation
- app layout shell
- login screen shell
- dashboard first version

## Assumptions For Now

Until we refine further, this guide assumes:

- the frontend is for internal staff only
- the overview dashboard is the default landing page after login
- the frontend will mirror the backend module names
- charts and summary metrics can begin with placeholder data if API aggregation endpoints are not yet finalized

## Next Step

After this document, the next implementation step is to scaffold the frontend project and begin the dashboard foundation.
