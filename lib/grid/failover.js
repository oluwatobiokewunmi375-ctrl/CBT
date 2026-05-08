export function failover(primaryNode, backupNodes) {
  if (!primaryNode.active) {
    return backupNodes[0]
  }
  return primaryNode
}
