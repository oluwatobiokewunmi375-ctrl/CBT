export function balanceLoad(nodes, exams) {
  return exams.map((exam, i) => ({
    exam,
    node: nodes[i % nodes.length]
  }))
}
