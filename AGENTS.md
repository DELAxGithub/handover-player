# AGENTS.md

Codex and other coding agents should use this file as the repository-specific working guide.

## Project Notes

- React 19 + Vite 7 video review app.
- App source lives in `src`.
- Shared UI components live in `src/components/ui`.
- Styling tokens live in `src/index.css`.
- Supabase schema files live at the repository root.
- Vercel is configured for deployment.

## Working Rules

- Keep changes scoped to the requested task.
- Preserve the existing light professional design language.
- Reuse components in `src/components/ui` before creating new UI primitives.
- Do not modify `.env.local` or other local secret files.
- Do not change Supabase schema files unless the task explicitly asks for data model work.
- Do not modify generated build output in `dist` by hand.

## Design Docs

`DESIGN.md` does not exist in this repo yet (planned, not yet written — see CLAUDE.md's Design System section for the current source of truth: `src/index.css` tokens + `src/components/ui/`). Once `DESIGN.md` is added, read it before touching CSS/UI and follow its pitfall checklist:

- Quote every front-matter number as a string (`lineHeight: "1.5"`) — unquoted numbers get silently dropped on export.
- `{reference}` syntax is only valid inside a `components` section — elsewhere it resolves to nothing, silently.
- Colors must be `#RRGGBB` — invalid CSS color functions pass lint but break the exported stylesheet.
- Duplicate `##` headings are not caught by lint — self-check with `grep -E '^## ' DESIGN.md | sort | uniq -d`.

## Verification

Prefer the repository check script when doing final verification:

```sh
scripts/check.sh
```

Equivalent targeted commands:

```sh
npm run lint
npm run build
```

## Safety

Require human approval before:

- Installing, removing, or upgrading dependencies.
- Changing Supabase schema or auth behavior.
- Running data registration scripts.
- Deploying to Vercel or changing deployment configuration.
- Touching `.env*` files beyond examples.

Do not run destructive git or filesystem cleanup commands.

## Good First Codex Tasks

- UI fixes that can be verified by lint/build and local browser checks.
- Small component refactors.
- Export-format bug fixes with sample inputs.
- Documentation updates that reflect existing behavior.

## Escalate To Human

- Dropbox integration behavior.
- Realtime collaboration semantics.
- Supabase schema changes.
- Deployment, production data, or auth changes.

