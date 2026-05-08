import { Services } from '../../services'

export function getService(name) {
  return Services[name]
}
