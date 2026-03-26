# Complaint Lifecycle Reference

## Statuses

- SUBMITTED_TO_OPERATOR
- IN_PROGRESS
- RESOLVED
- ESCALATION_REQUESTED
- ESCALATED_TO_BOCRA
- UNDER_INVESTIGATION
- CLOSED

## Allowed transitions

- SUBMITTED_TO_OPERATOR -> IN_PROGRESS
- IN_PROGRESS -> RESOLVED
- IN_PROGRESS -> ESCALATION_REQUESTED
- RESOLVED -> CLOSED
- ESCALATION_REQUESTED -> ESCALATED_TO_BOCRA
- ESCALATED_TO_BOCRA -> UNDER_INVESTIGATION
- UNDER_INVESTIGATION -> CLOSED

## Layer visibility

### Public submitter / authenticated consumer
- complaint creation
- complaint tracking via token or account

### Operator
- initial complaint handling
- operator-owned complaints only

### Admin
- escalation-stage complaints only

### Public dashboard
- aggregated anonymized outcomes only