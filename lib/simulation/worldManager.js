const worlds = []

export function manageWorld(world) {
  worlds.push(world)

  return {
    activeWorlds: worlds.length,
    status: 'RUNNING'
  }
}
