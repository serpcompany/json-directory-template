# Archived Product Features

This folder holds the product-era parts of the app that are no longer part of the active static starter.

## Moved Here

- Auth, login, profile, settings, members, and community routes
- Old API routes and proxy middleware
- Server-backed submit flow, newsletter flow, CSRF helpers, and OpenPanel support
- Member/profile/auth/community UI and related tests
- Extension-specific pages and helpers

## Why

The active starter now aims to be:

- JSON-first
- static-friendly
- GitHub Pages/export-friendly
- low-dependency at runtime

## Current Active Alternatives

- Favorites: `localStorage`
- Submit: prefilled GitHub issue
- Analytics: optional GTM only

## If Restoring Features Later

Review these areas together rather than cherry-picking single files:

- route
- component
- hook
- lib
- env/config

Most archived features previously depended on auth, API routes, middleware, or external services.
