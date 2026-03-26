<!-- BEGIN:nextjs-agent-rules -->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

# BOCRA Admin App Repository Guide

## Project purpose

This repository is the **admin Next.js application** for the BOCRA Regulatory Intelligence Platform.

The overall platform supports three layers over one shared Convex backend:

- **Admin layer**: BOCRA internal dashboard
- **Operator layer**: complaint handling and compliance workspace for operators
- **Public layer**: aggregated, anonymized transparency data for website visitors

This repository is **admin-first**, but backend design must support later operator and public clients using the same Convex backend.

## Stack

- Next.js
- Convex
- Clerk
- TypeScript
- Tailwind CSS

## Mandatory reading order before coding

Before writing or editing code:

1. Read this `AGENTS.md`
2. If working on Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/`
3. If working on Convex code, read `convex/_generated/ai/guidelines.md`
4. If the task matches a repo skill, use the relevant skill in `.codex/skills/`

Do not rely on memory alone for Next.js or Convex behavior.

## Core architecture rules

- Use **Convex as the backend**
- Do **not** introduce Express
- Do **not** introduce Prisma
- Do **not** introduce PostgreSQL
- Do **not** introduce REST controllers or a parallel API server
- Clerk handles **authentication**
- Convex stores app users and roles for **authorization**
- All business logic must live in Convex functions or shared Convex helper modules
- Keep Convex code organized by responsibility:
  - `convex/admin/`
  - `convex/operator/`
  - `convex/public/`
  - `convex/shared/`

## Role model

Application roles are stored in Convex:

- `ADMIN`
- `OPERATOR`
- `USER` (optional/future-facing, for signed-in public users)

Do not assume a Clerk-authenticated user is automatically an admin.
Always resolve the current user through the Convex `users` table and check role there.

## Complaint workflow rules

The complaint lifecycle is regulated and must follow these transitions only:

- `SUBMITTED_TO_OPERATOR -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `IN_PROGRESS -> ESCALATION_REQUESTED`
- `RESOLVED -> CLOSED`
- `ESCALATION_REQUESTED -> ESCALATED_TO_BOCRA`
- `ESCALATED_TO_BOCRA -> UNDER_INVESTIGATION`
- `UNDER_INVESTIGATION -> CLOSED`

No other status transitions are allowed.

## Visibility rules

### Admin
Admin must only see escalation-stage complaints by default:

- `ESCALATION_REQUESTED`
- `ESCALATED_TO_BOCRA`
- `UNDER_INVESTIGATION`
- `CLOSED` complaints only if they were previously escalated

Admin must **not** see ordinary operator-stage complaints in the default admin queue.

### Operator
Operator must only see complaints assigned to that operator.

### Public
Public routes must return **aggregated and anonymized data only**.
Never expose raw complaints, internal notes, or internal admin/operator data in public functions.

## Complaint submission rules

Complaints may be submitted by:

- a **public** submitter
- an **authenticated** submitter

A complaint is not required to belong to a user account.

A complaint must contain at least one of:

- text description
- uploaded complaint document

## File upload rules

Allowed complaint submission patterns:

1. Write complaint text directly, with optional evidence file
2. Upload one complaint document, with optional evidence file

Hard limits:

- max **1** complaint document
- max **1** evidence document
- max **2 MB** per file

Enforce these limits in  backend validation.

## SLA and escalation rules

SLA is defined by operator complaint policy, not entered arbitrarily per complaint.

Each operator may define complaint handling policy by category.

Escalation is criteria-based and must depend on:

- complaint category
- operator complaint policy
- SLA breach state
- escalation eligibility rules

Escalation may happen by:

- user request after eligibility is met
- automatic system escalation on SLA breach, if policy allows it

## Current implementation focus

Build the following first:

1. Convex schema
2. Clerk + Convex auth and role sync
3. Admin-only protected app shell
4. Admin queries/mutations for:
   - dashboard summary
   - escalated complaints queue
   - complaint detail
   - operator oversight
   - licensing overview

Do not build operator UI or public UI.

## Preferred repository structure

### App
- `app/`
- `components/`
- `lib/`

### Convex
- `convex/schema.ts`
- `convex/admin/`
- `convex/operator/`
- `convex/public/`
- `convex/shared/`

### Codex skills
- `.codex/skills/convex-backend-setup/`
- `.codex/skills/clerk-auth-and-role-sync/`
- `.codex/skills/admin-feature-implementation/`
- `.codex/skills/workflow-guardrails/`

## Coding rules

- Prefer small focused files
- Keep types explicit
- Use shared helpers for workflow validation
- Avoid duplicating complaint workflow logic across functions
- Do not hardcode role checks in UI
- Do not bypass Convex authorization checks
- Do not introduce mock architecture that conflicts with these domain rules
- Do not add unrelated libraries unless required for the current task
- When using Convex, follow the guidance in `convex/_generated/ai/guidelines.md`
- When using Next.js features, verify against current docs in `node_modules/next/dist/docs/`

## What not to do

- Do not create Express endpoints
- Do not create Prisma models
- Do not create SQL migrations
- Do not build a full licensing application workflow
- Do not expose non-escalated complaints to admin by default
- Do not expose sensitive complaint details in public routes
- Do not tie every complaint to an authenticated user account
- Do not reintroduce removed fields like `desiredRemedy`

## Commands

Install dependencies:

```bash
npm install
<!-- convex-ai-end -->
