const nodes = []

export function registerNode(node) {
  nodes.push({
    id: node.id,
    region: node.region,
    status: 'ACTIVE'
  })

  return nodes
}
