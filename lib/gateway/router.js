import { apiGateway } from './core'

export function routeRequest(req) {
  const { service, action, data } = req

  return apiGateway(service, action, data)
}
