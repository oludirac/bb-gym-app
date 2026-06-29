# AGENTS.md

## Purpose

This file gives coding agents clear working instructions for this repository.

Follow these instructions unless the user gives a more specific direction.

## Working principles

- Understand the existing code before editing.
- Prefer small, focused changes.
- Do not rewrite large areas unnecessarily.
- Preserve existing architecture and conventions.
- Avoid adding dependencies unless clearly needed.
- Do not introduce secrets, API keys, or credentials.
- Do not remove working functionality without explaining why.
- Prefer simple, maintainable solutions over clever abstractions.

## Before making changes

1. Inspect the relevant files.
2. Identify the smallest safe change.
3. Check existing patterns for naming, styling, imports, testing, and structure.
4. Explain any major tradeoff before choosing a direction.

## Commands

Use the package manager and scripts already present in the repository.

Common checks to look for:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
