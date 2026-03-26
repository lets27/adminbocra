# Convex Data Model Reference

## Tables

### users
Purpose:
Store application roles and future authenticated identity mappings.

Expected fields:
- clerkId (optional until Clerk is installed)
- email
- name
- role
- operatorId (optional)
- isActive
- createdAt

### operators
- name
- email
- contactPhone
- licenseType
- licenseStatus
- expiryDate
- complianceScore
- riskLevel
- regionCoverage
- slaPolicyConfigured
- createdAt
- updatedAt

### operatorComplaintPolicies
- operatorId
- complaintCategory
- slaHours
- isEscalatable
- autoEscalateOnSlaBreach
- createdAt
- updatedAt

### complaints
- referenceNumber
- trackingToken
- submitterType
- submittedByUserId (optional)
- consumerName (optional)
- consumerEmail (optional)
- consumerPhone (optional)
- operatorId
- category
- description (optional)
- status
- submittedAt
- slaDeadline
- resolvedAt
- escalatedAt
- closedAt
- createdAt
- updatedAt

### complaintDocuments
- complaintId
- documentType
- storageId
- fileName
- fileType
- fileSize
- uploadedByType
- uploadedAt

### complaintMessages
- complaintId
- senderType
- senderUserId (optional)
- message
- createdAt

### escalations
- complaintId
- triggerType
- triggeredByUserId (optional)
- validationPassed
- policySnapshot
- triggeredAt
- createdAt

### regulatoryActions
- complaintId (optional)
- operatorId
- actionType
- notes
- createdByUserId
- createdAt

### notificationLogs
- complaintId (optional)
- channel
- recipient
- subject (optional)
- message
- status
- createdAt

## Complaint categories for demo

- NETWORK_OUTAGE
- BILLING_DISPUTE
- POOR_CALL_QUALITY
- SERVICE_ACTIVATION_DELAY