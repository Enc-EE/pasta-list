---
applyTo: "web/**/*.{ts,tsx}"
description: React, MUI and Redux conventions for the Pasta List frontend.
---

# Frontend instructions

## Package management

- **pnpm only.** `pnpm install`, `pnpm add <pkg>`, `pnpm add -D <pkg>`, `pnpm dev`,
  `pnpm lint`, `pnpm build`. Never run `npm` or `yarn` in this folder.
- `pnpm-lock.yaml` is the only lockfile and belongs in git. If a `package-lock.json`
  shows up, delete it.
- pnpm does not run install scripts unless the package is listed under `allowBuilds`
  in `pnpm-workspace.yaml`. Add entries there only when a dependency genuinely needs it.

## State

- Server data: RTK Query only, defined in `src/features/api/pastaListApi.ts`.
  Add endpoints there and export the generated hook.
- Cache invalidation uses the `ShoppingList` tag with the list id, plus the
  sentinel id `'LIST'` for collection queries. Keep new endpoints consistent.
- Use `onQueryStarted` + `updateQueryData` for optimistic updates and always
  `patch.undo()` in the catch block.
- UI state: slices under `src/features/<feature>/`, created with `createSlice`.
  Action names are past tense (`themeModeToggled`, `snackbarShown`).
- Never call `useDispatch`/`useSelector` directly — use the typed hooks in `src/app/hooks.ts`.

## Components

- Function components with a default export, one component per file.
- Props are typed with an exported `interface <Name>Props`. No `React.FC`.
- Folder layout: `components/<area>/` for reusable UI, `pages/` for routed screens.
- Data fetching happens in pages; presentational components take props.

## MUI v9

- Import per component: `import Button from '@mui/material/Button'`.
- Icons import individually from `@mui/icons-material/<IconName>`.
  Check the package before guessing a name — e.g. `DeleteOutlined` exists, `DeleteOutline` does not.
- System props (`alignItems`, `justifyContent`, `p`, `m`, ...) are **not** valid
  directly on `Stack`/`Box` in v9. Put them in `sx`.
- All colors, spacing and radii come from the theme in `src/theme/theme.ts`.
  No hard-coded hex values in components, no CSS files.
- Interactive elements need an accessible name (`aria-label`) when they only render an icon.

## TypeScript

- `strict` is on. No `any`, no `@ts-ignore`.
- Use `import type { ... }` for type-only imports.
- Shared API types live in `src/types/shoppingList.ts` and must mirror the C# DTOs.

## Networking

- Use relative `/api` URLs; the Vite dev server proxies to the API.
- Handle mutation failures with `try { await ...unwrap() } catch` and dispatch
  `snackbarShown` with severity `error`. Never swallow an error silently.
