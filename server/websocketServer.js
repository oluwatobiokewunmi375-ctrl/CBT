const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })

const clients = []

wss.on('connection', (ws) => {
  clients.push(ws)

  ws.on('message', (message) => {
    console.log('Received:', message)
  })

  ws.on('close', () => {
    const index = clients.indexOf(ws)
    if (index > -1) clients.splice(index, 1)
  })
})

function broadcast(data) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}

module.exports = { broadcast }
