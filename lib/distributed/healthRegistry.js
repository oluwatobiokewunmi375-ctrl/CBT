const nodeHealth = new Map()

export function updateNodeHealth(nodeId, status) {
  nodeHealth.set(nodeId, {
    status,
    timestamp: Date.now()
  })
}

export function getNodeHealth() {
  return Array.from(nodeHealth.entries())
}
