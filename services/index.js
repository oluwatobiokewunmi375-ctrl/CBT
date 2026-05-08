import { AuthService } from './auth'
import { SchoolService } from './school'
import { ExamService } from './exam'
import { PaymentService } from './payment'
import { AnalyticsService } from './analytics'
import { WorkerService } from './worker'

export const Services = {
  auth: AuthService,
  school: SchoolService,
  exam: ExamService,
  payment: PaymentService,
  analytics: AnalyticsService,
  worker: WorkerService
}
