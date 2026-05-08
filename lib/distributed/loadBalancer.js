export function loadBalance(requests) {
  const nodes = ['node-a', 'node-b', 'node-c']

  return requests.map((req, index) => ({
    ...req,
    assignedNode: nodes[index % nodes.length]
  }))
}
