# Convex Function Map Reference

## Admin queries
- getDashboardSummary
- getEscalatedComplaints
- getComplaintById
- getOperators
- getOperatorById
- getLicensingOverview
- getAnalyticsByRegion
- getAnalyticsByCategory
- getAnalyticsByOperator

## Admin mutations
- startInvestigation
- closeComplaint
- addComplaintMessage
- createRegulatoryAction
- updateOperatorLicenseStatus

## Operator queries
- getAssignedComplaints
- getComplaintById
- getSlaQueue
- getMetrics

## Operator mutations
- startComplaint
- resolveComplaint
- addMessage

## Public queries
- getOperatorScorecards
- getRegionalInsights
- getCategoryTrends
- trackComplaintByToken

## Shared helpers
- getCurrentUser
- requireAdmin
- requireOperator
- canTransitionComplaint
- evaluateEscalationEligibility
- calculateComplianceScore
- generateReferenceNumber
- generateTrackingToken
- validateComplaintSubmission
- validateComplaintFiles