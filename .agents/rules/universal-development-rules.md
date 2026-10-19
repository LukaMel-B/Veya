# Veya — Universal Development Rules for Antigravity

Apply these rules to every task in this project, regardless of platform. These rules govern how you inspect, implement, verify, document and report changes.

## 1. Strict Scope Control — Change Nothing Else

**Implement only what is explicitly requested in the current task. Everything outside the stated scope must remain untouched.**

- Do not modify, redesign, refactor, remove, replace or improve anything that was not explicitly requested.
- Do not add unrequested features, UI elements, sections, settings, workflows, dependencies or behaviours.
- Do not make unsolicited improvements, even if they appear to improve usability, consistency, code quality or appearance.
- Do not modify unrelated files simply because they are nearby or part of the same component.
- Do not perform opportunistic code cleanup, architecture changes, dependency upgrades or renaming.
- Preserve all existing functionality unless the task explicitly requires changing it.

If an additional change appears necessary, explain why and ask for approval before expanding the scope, unless it is strictly necessary to implement the requested change safely.

## 2. Preserve the Existing Design

**Never change the design unless the current task explicitly requests a design change.**

Unless specifically mentioned, preserve:
- Design system, theme, colours and design tokens.
- Typography, font sizes, weights and text styles.
- Layout, spacing, alignment, sizing and positioning.
- Icons, illustrations, images, borders, shadows and corner radii.
- Animations, transitions and interaction styling.
- Navigation, active states, component appearance and responsive behaviour.
- Existing text, labels, copy and content.

When a design change is explicitly requested, modify only the named element and the minimum directly necessary styles. Do not extend the change to other screens or components without permission.

## 3. Preserve Functionality, Architecture and User Data

- Keep unrelated features and behaviours working exactly as before.
- Preserve the existing architecture, dependencies and project configuration wherever possible.
- Do not change APIs, database schemas, storage formats, migrations or data relationships unless strictly necessary for the requested task.
- Never reset, delete, overwrite or modify user data as an unrelated side effect.
- Do not rename, move or remove existing files, identifiers or configurations without a clear requirement.
- Preserve backward compatibility wherever applicable.
- Do not weaken tests or remove existing coverage simply to make checks pass.

## 4. Maintain a Permanent Change History

**Every task that produces an actual code, feature, design, behaviour, configuration or documentation change must be recorded in a persistent `CHANGE_HISTORY.md` file at the root of the current project.**

- Check whether the file already exists. If it does, append a new entry. If it does not, create it.
- Maintain one history file per project. Never combine the histories of separate projects.
- Never silently delete or rewrite earlier history entries.
- Keep entries chronological and sufficiently detailed to understand and reverse individual changes.

Each entry must include:

1. **Date and title** — a clear identifier for the change.
2. **Reason** — the original issue or requirement.
3. **Previous behaviour** — what happened before, when known.
4. **New behaviour** — precisely what changed.
5. **Affected screens and workflows** — where the change is visible or functional.
6. **Files and components modified** — exact project-relative paths and their purpose.
7. **Technical details** — relevant logic, styling, state management, data operations, dependencies or configuration changes.
8. **Data and compatibility impact** — schema, migration, storage or user-data implications.
9. **Verification results** — checks actually run and their outcomes.
10. **Limitations** — unresolved issues or known risks.
11. **Reversal guidance** — the files and code paths to inspect or revert, including dependencies and migration risks.

Document actual changes only. Do not claim that a change was implemented or tested unless the code and results support that claim.

For tasks that produce no actual changes, do not create a misleading history entry.

## 5. Keep the PRD Focused on the Current Application

The existing PRD describes the application's current behaviour, requirements, features, architecture and relevant limitations.

- Update the existing PRD in place only when the task changes its current specifications.
- Do not use the PRD as the only historical record of development.
- Preserve detailed implementation history in `CHANGE_HISTORY.md`.
- Do not create a competing PRD or duplicate the entire PRD in the history file.
- If the current implementation does not change the documented requirements, leave the PRD untouched.
- Update relevant existing technical or design documentation only when necessary.

The PRD answers **“What is the application now?”**

The change history answers **“What changed, why, where, and how can it be reversed?”**

## 6. Keep Development Documentation Out of the Shipped Application

All PRDs, change histories and development documents are for maintainers, not end users.

- Store documentation at the project root or in an appropriate source-documentation directory.
- Do not import or bundle Markdown documentation into application code.
- Do not place documentation in runtime asset directories or package it into production assets.
- Do not add an in-app changelog, documentation viewer or runtime dependency for this purpose.
- Ensure normal production builds exclude development documentation from shipped application assets.
- Do not change packaging or dependencies solely to support documentation.

Documentation must not increase the shipped application's size or affect runtime behaviour.

## 7. Project Isolation

I maintain separate projects for different platforms and workflows. **Always work exclusively inside the project explicitly selected for the current task.**

- Confirm the current project root before running commands or modifying files.
- Do not inspect, access, modify or run Git commands against sibling projects.
- Do not traverse the common parent directory to discover or inspect other projects.
- Do not use shared workspace-level commands that might modify multiple projects.
- Keep each project's source code, Git history, PRD, `CHANGE_HISTORY.md`, configuration and build outputs independent.
- Do not copy changes between projects unless explicitly requested.
- If the project root cannot be identified unambiguously, stop and ask rather than guessing.

A task mentioning a platform does not grant permission to inspect another platform's project.

## 8. Lightweight and Appropriate Verification

Verify only what is relevant to the requested change.

- Inspect the actual code path responsible for the issue.
- Run existing targeted tests where available.
- Run type checks, linting and production builds when appropriate and reasonably quick.
- Inspect generated assets or configuration only when relevant to the task.
- Avoid unnecessary full test suites, long-running workflows or unrelated checks.
- Do not automatically launch emulators, simulators, physical-device testing or lengthy UI-testing workflows for simple changes.
- If verification requires a slow or resource-intensive environment, skip it unless explicitly requested and report the limitation.
- Never claim that unperformed tests passed or that visual behaviour was verified when only source-code checks were performed.

Record the actual commands, results and limitations in the change history.

## 9. Minimal, Targeted Implementation

For every task:

1. Confirm the project root.
2. Inspect the relevant existing code and components.
3. Identify the smallest change that fully addresses the request.
4. Implement only the approved scope.
5. Check for unintended effects on unrelated functionality.
6. Run appropriate lightweight verification.
7. Update `CHANGE_HISTORY.md` with the actual implementation and results.
8. Update the existing PRD or other documentation only if necessary.
9. Report the changes and any remaining limitations.

Do not repeat broad discovery, rebuild unrelated functionality or redo previously completed work without a clear reason.

## 10. Final Report

At the end of each task, briefly report:

- What changed and why.
- The exact files and components modified.
- Any PRD or design-documentation updates and why they were necessary.
- The change-history file and entry added.
- Tests and checks actually performed, with results.
- Any data, compatibility or reversal considerations.
- Remaining issues or checks not performed.

Do not report unrelated files as changed. Do not claim unperformed checks passed.

## Final Rule

**Only make explicitly requested changes. Preserve everything else, document every actual update in the current project's root-level `CHANGE_HISTORY.md`, keep the PRD focused on the current application, keep separate projects isolated, and ensure development documentation never enters the shipped application bundle.**
