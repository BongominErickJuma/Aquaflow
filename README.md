# IBMS Frontend

The IBMS Frontend is the internal web dashboard for the Ice Business Management System.

It will consume the AquaFlow backend API and present a focused operations experience for one ice company across:

- authentication
- business management
- inventory
- production
- workforce
- compliance
- sales
- finance

## Frontend Direction

This frontend will be built with:

- React
- Vite
- TypeScript
- Tailwind CSS

Recommended supporting libraries as we build:

- React Router for navigation
- TanStack Query for server state
- Axios for API requests
- Framer Motion for transitions and reveal animations
- Recharts for dashboard charts

## Product Style

The visual direction is a cold industrial dashboard:

- deep navy and steel surfaces
- ice blue highlights
- fog-gray neutral backgrounds
- clean operational layouts
- subtle glass-like cards where useful
- restrained motion focused on clarity

This should feel like an operations control center, not a generic admin template.

## Initial Frontend Goal

The first delivery will be a simple dashboard that gives a quick picture of the business:

- key summary metrics
- operational alerts
- quick links to core modules
- recent activity

The dashboard should be designed so later module pages can reuse the same layout, card patterns, table styles, and motion system.

## Expected Frontend Milestones

### Milestone F1: Project Setup

- create the Vite React TypeScript app
- add Tailwind CSS
- define the theme tokens
- set up routing
- set up API client structure
- create the application shell

### Milestone F2: Authentication Flow

- login screen
- CSRF bootstrap flow
- authenticated route protection
- session handling

### Milestone F3: Dashboard

- overview page
- KPI cards
- alerts panel
- activity feed
- quick access module cards

### Milestone F4 and Beyond: Module Screens

- business
- inventory
- production
- workforce
- compliance
- sales
- finance

## Working Approach

We will keep the frontend simple and modular:

1. define the app shell first
2. build the dashboard as the visual foundation
3. connect reusable cards, tables, filters, and forms
4. expand one module at a time
5. keep the frontend aligned to the backend milestones and API contracts

## Documentation

Detailed frontend planning lives in:

- [docs/IMPLEMENTATION_GUIDE.md](D:/Clients/IBMS/IBMS-Frontend/docs/IMPLEMENTATION_GUIDE.md)
