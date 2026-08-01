# Workspace Copilot Instructions

## Chat Saving

When a chat appears to reach a natural conclusion, or when the user explicitly requests it (e.g. "save this chat", "save our conversation"), save the conversation to the `copilot-chats/` folder at the root of this workspace.

### File Naming

Use this naming convention:

```
copilot-chats/YYYY-MM-DD-<short-topic-slug>.md
```

Example: `copilot-chats/2026-06-14-engine-refactor.md`

Use today's date and a short kebab-case slug that describes the main topic of the chat.

### File Format

Each saved chat file must follow this structure:

```markdown
# Chat: <Descriptive Title>

**Date:** YYYY-MM-DD  
**Topic:** <One-line description of what was discussed>

---

## Summary

<3–6 sentence summary of the chat. Capture the key decisions made, problems solved, and any important context for future reference.>

## Key Decisions

- <Decision or outcome 1>
- <Decision or outcome 2>
- ...

## Files Changed

- `path/to/file.ts` — <what changed and why>
- ...

---

## Full Chat

### User
<user message>

### Copilot
<assistant response>

### User
<user message>

### Copilot
<assistant response>

...
```

If the full chat transcript is very long, include only the substantive exchanges and omit trivial back-and-forth (e.g. "ok", "thanks", "go ahead"). Preserve all messages that contain decisions, code, or important context.

## Requirements Tracker

`game-requirements.md` at the workspace root is the living requirements document. Copilot must keep it accurate.

### When to update `game-requirements.md`

- **New feature requested** — add a row in the appropriate section with status `📋`.
- **Feature implemented** — change the status to `🧪` (awaiting feedback) or `✅` (confirmed working).
- **Feedback received** — add a row to the **Feedback Log** table and update the feature status if it changed.
- **Feature rejected or deprioritized** — mark it `❌` with a note.

Do not add new sections unless a new system category genuinely does not fit any existing section.

---

## Changelog

`CHANGELOG.md` at the workspace root tracks what ships to GitHub.

### When to update `CHANGELOG.md`

- **Before or when committing features** — add entries under `[Unreleased]` grouped by version number using the `### yyyy.mm.dd.n.n` heading format.
- Under each version heading, use concise bullet points summarizing the shipped changes.
- List the most recent version first under `[Unreleased]`.
- **When deployment versions change** — update the relevant deployment record version and add a matching `CHANGELOG.md` entry in the same change.
- **When a release is tagged** — rename `[Unreleased]` to `[YYYY-MM-DD]` and add a new empty `[Unreleased]` block at the top.
- Do not use `Added`, `Changed`, `Fixed`, or `Removed` subsections.
- Keep entries concise: one line per bullet, referencing the relevant file or feature ID from `game-requirements.md` where helpful (e.g., `F-07`, `U-05`).

## Deployment Versioning

Each deployment record must include a version number.

### Version Format

Use this exact format:

`yyyy.mm.dd.n.n`

Example:

`2026.08.01.1.0`

### Versioning Rules

- Update the version in the tracked deployment record whenever a deployment-relevant change is prepared.
- Update `CHANGELOG.md` in the same change whenever a deployment version changes.
- Keep the deployment version visible in structured deployment data so the portal can display it.

---

## General Behavior

- Follow the game design framework defined in `space-future-game.instructions.md` for all game-related work.
- Keep responses concise unless asked to elaborate.
- Prefer TypeScript and data-driven patterns consistent with the existing codebase.
