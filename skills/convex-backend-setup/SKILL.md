---
name: convex-backend-setup
description: Use this skill when creating or updating the Convex schema, tables, indexes, queries, mutations, actions, and shared backend helpers for the BOCRA Regulatory Intelligence Platform.
---

# Purpose

This skill is for setting up and maintaining the Convex backend for the BOCRA Regulatory Intelligence Platform.

Use this skill when working on:

- `convex/schema.ts`
- Convex queries
- Convex mutations
- Convex actions
- Convex shared helper modules
- backend function organization
- indexes and data modeling
- file upload validation logic
- complaint workflow logic

Do not use this skill for UI-only tasks.

## Current implementation stage

This repository is currently in the **pre-auth backend setup stage**.

That means:

- Convex backend structure should be created now
- admin-first backend logic should be created now
- Clerk authentication will be added later by the developer
- code generated now must be **compatible with future Clerk integration**
- do not implement Clerk setup in this skill
- do not block backend progress on missing Clerk code

## Backend architecture rules

Convex is the only backend in this repository.

Do not introduce:

- Express
- Prisma
- PostgreSQL
- REST controllers
- API route controllers as a replacement for Convex
- duplicate backend stacks

Use this structure:

- `convex/admin/`
- `convex/operator/`
- `convex/public/`
- `convex/shared/`

## Required tables

The backend must support these tables:

- `users`
- `operators`
- `operatorComplaintPolicies`
- `complaints`
- `complaintDocuments`
- `complaintMessages`
- `escalations`
- `regulatoryActions`
- `notificationLogs`

## Data model rules

### users
Used for app roles and authorization, not just identity.

Role model:
- `ADMIN`
- `OPERATOR`
- `USER`

At this stage, do not implement Clerk sync yet.
Design the `users` table so that Clerk can later map into it cleanly.

Expected identity fields later:
- `clerkId`
- `email`
- `name`

If temporary local placeholders are needed during setup, keep them minimal and clearly marked as temporary.

### complaints
Complaints may be submitted by:
- public users
- authenticated users

Complaint records must not require a user account.

A complaint must contain at least one of:
- text description
- uploaded complaint document

Do not include `desiredRemedy`.

### operatorComplaintPolicies
SLA must be defined through operator complaint policy, not free-form complaint input.

This table is required because escalation depends on category-specific policy.

### escalations
Escalation is structured and criteria-based.
Do not use free-form reason text as the primary escalation basis.

Use structured fields such as:
- trigger type
- validation result
- policy snapshot

## Complaint workflow rules

Allowed status transitions only:

- `SUBMITTED_TO_OPERATOR -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `IN_PROGRESS -> ESCALATION_REQUESTED`
- `RESOLVED -> CLOSED`
- `ESCALATION_REQUESTED -> ESCALATED_TO_BOCRA`
- `ESCALATED_TO_BOCRA -> UNDER_INVESTIGATION`
- `UNDER_INVESTIGATION -> CLOSED`

Use a shared helper for transition validation.
Do not duplicate transition logic in many functions.

## Visibility rules

### Admin
Admin default queries must only include escalation-stage complaints:
- `ESCALATION_REQUESTED`
- `ESCALATED_TO_BOCRA`
- `UNDER_INVESTIGATION`
- escalated `CLOSED`

### Operator
Operator functions must only access complaints belonging to that operator.

### Public
Public functions must return only aggregated and anonymized data, plus tracking-token-based complaint lookup where explicitly intended.

## File upload rules

Support:
- one complaint document
- one evidence document

Limits:
- max 2 MB per file
- enforce in backend validation
- keep metadata in Convex records
- do not allow unlimited attachments

Allowed submission paths:
1. text complaint + optional evidence file
2. complaint document + optional evidence file

## Function organization

### Admin functions
Use `convex/admin/` for:
- dashboard summary
- escalated complaints queue
- complaint detail
- investigation actions
- operator oversight
- licensing intelligence
- analytics

### Operator functions
Use `convex/operator/` for:
- assigned complaints
- SLA queue
- operator complaint detail
- operator updates

### Public functions
Use `convex/public/` for:
- operator scorecards
- aggregated trends
- tracking token lookup

### Shared helpers
Use `convex/shared/` for:
- current-user resolution hooks/helpers
- role check helpers
- complaint transition validation
- escalation evaluation
- compliance scoring
- reference number generation
- tracking token generation
- file validation

## Coding rules

- prefer explicit validators
- add indexes for all common lookup patterns
- keep functions small and purpose-specific
- use shared helper functions for repeated domain logic
- do not place UI logic in Convex files
- do not bypass future authorization design
- do not expose internal data through public functions
- do not prematurely implement Clerk setup in this skill

## Expected outputs when using this skill

Depending on the task, generate:
- schema definitions
- Convex queries
- Convex mutations
- Convex actions
- helper modules
- typed validators
- backend-safe function structure

## Reference files

Review:
- `references/data-model.md`
- `references/function-map.md`