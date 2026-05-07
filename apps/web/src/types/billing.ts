export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  description: string;
  features: {
    maxUsers: number;
    maxExams: number;
    maxQuestionsPerExam: number;
    maxStorage: number;
    enableVideoProctoring: boolean;
    enableCustomBranding: boolean;
    enableAPI: boolean;
    enableAdvancedAnalytics?: boolean;
  };
}

export interface Subscription {
  id: string;
  schoolId: string;
  plan: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxUsers: number;
  maxExams: number;
  maxQuestionsPerExam: number;
  amount: number;
  currency: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  cancelledAt?: string;
  autoRenew: boolean;
}

export interface UsageStats {
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
  exams: {
    used: number;
    limit: number;
    percentage: number;
  };
  questions: {
    used: number;
    limit: number;
    percentage: number;
  };
  features: {
    videoProctoring: boolean;
    customBranding: boolean;
    api: boolean;
    advancedAnalytics: boolean;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  status: string;
  issuedDate: string;
  dueDate?: string;
  paidDate?: string;
}