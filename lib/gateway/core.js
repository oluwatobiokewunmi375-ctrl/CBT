import { Services } from '../../services'

export function apiGateway(service, action, payload) {
  if (!Services[service]) {
    return { error: 'SERVICE_NOT_FOUND' }
  }

  const targetService = Services[service]

  if (!targetService[action]) {
    return { error: 'ACTION_NOT_FOUND' }
  }

  return targetService[action](payload)
}
