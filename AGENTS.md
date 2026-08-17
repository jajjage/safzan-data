# Safzan Frontend

This is a tenant frontend project in the Nexus tenant workspace.

## Parent Context

- Read `../WORKSPACE.md` before cross-codebase work.
- Read `../workspace-projects.yml` for registered project relationships.
- Track cross-codebase work in `../.scratch/`.

## Project Boundary

- Owns Safzan tenant frontend UI, routing, branding, and tenant-specific client behavior.
- Depends on `../nexus-data-multi-tenant` for shared backend APIs and tenancy rules.
- Do not change backend contracts here without recording the coordinated change in the parent workspace.

## Local Context

- Keep project-specific commands and conventions in this file as they become known.
- Add `CONTEXT.md` for Safzan-specific domain terms when the project needs local vocabulary.
- Record frontend-specific architecture decisions under `docs/adr/`.
