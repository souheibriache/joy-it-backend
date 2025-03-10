// analytics/dto/analytics-response.dto.ts
export class AnalyticsResponseDto {
  totalCompanies: number
  verifiedCompanies: number
  unverifiedCompanies: number

  totalSchedules: number
  completedSchedules: number
  pendingSchedules: number
  canceledSchedules: number

  totalActivities: number
}
