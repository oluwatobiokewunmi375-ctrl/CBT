import { getTenantContext } from '@/lib/saas/tenant/context'

export function useTenant(request) {
  return getTenantContext(request)
}
