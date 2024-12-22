// analytics/dto/analytics-response.dto.ts
export class AnalyticsResponseDto {
  totalCompanies: number
  verifiedCompanies: number
  unverifiedCompanies: number

  totalPlans: number
  subscriptionsPerPlan: Record<string, number>

  totalSubscriptions: number

  totalSchedules: number
  completedSchedules: number
  pendingSchedules: number
  canceledSchedules: number

  totalActivities: number

  totalCreditsConsumed: number
}
