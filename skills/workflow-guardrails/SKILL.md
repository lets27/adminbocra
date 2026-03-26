---
name: workflow-guardrails
description: Use this skill when implementing or reviewing complaint workflow, escalation, upload validation, visibility boundaries, and other domain guardrails for the BOCRA platform.
---

# Purpose

This skill exists to prevent invalid implementations of the BOCRA complaint and escalation workflow.

Use this skill when working on:

- complaint validation
- file upload rules
- escalation criteria
- complaint status transitions
- public/admin/operator visibility boundaries
- complaint tracking behavior
- workflow review

## Critical workflow rules

### Complaint transitions
Allowed transitions only:

- `SUBMITTED_TO_OPERATOR -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `IN_PROGRESS -> ESCALATION_REQUESTED`
- `RESOLVED -> CLOSED`
- `ESCALATION_REQUESTED -> ESCALATED_TO_BOCRA`
- `ESCALATED_TO_BOCRA -> UNDER_INVESTIGATION`
- `UNDER_INVESTIGATION -> CLOSED`

Reject all other transitions.

### Complaint creation
A complaint must include at least one of:
- description text
- uploaded complaint document

Complaints may be submitted by:
- public users
- authenticated users

Do not require a user account for every complaint.

### File upload limits
Allow:
- max 1 complaint document
- max 1 evidence document
- max 2 MB per file

### Escalation rules
Escalation must be criteria-based.

Inputs may include:
- complaint category
- operator complaint policy
- SLA deadline
- elapsed time
- escalation eligibility
- auto-escalation settings
- user-requested escalation

Do not rely on vague free-text reason as the main escalation logic.

### Visibility rules

#### Admin
Admin default queue may only include escalation-stage complaints.

#### Operator
Operator may only access complaints belonging to that operator.

#### Public
Public functions may only expose aggregated/anonymized data or complaint tracking data for a valid tracking token.

## Tracking rules

Every complaint must receive:
- a reference number
- a tracking token

Tracking is especially important for public submitters with no account.

## Future-auth awareness

Clerk will be added later.

That means:
- do not block workflow setup on missing Clerk code
- design validations and visibility rules so future auth can slot in cleanly
- do not hardcode temporary no-auth shortcuts into long-term workflow code

## Review rules

When reviewing generated code, reject implementations that:
- bypass transition validation
- expose raw complaints publicly
- show non-escalated complaints in admin default queue
- allow unlimited file uploads
- tie all complaints to authenticated users only
- reintroduce removed fields like `desiredRemedy`
- place business rules only in frontend code

## Expected outputs when using this skill

Depending on the task, generate or review:
- transition helpers
- escalation evaluation helpers
- complaint validators
- upload validators
- role/visibility validation helpers
- code review corrections for workflow violations

## Reference files

Review:
- `references/complaint-lifecycle.md`
- `references/upload-rules.md`