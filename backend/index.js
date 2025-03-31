// node modules
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

// custom modules
import * as gamelogic from './modules/gamelogic.js'

// Set up server
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

//////////////////////////////////
let gameState = new gamelogic.GameState()
let socketMapping = new Map()
//////////////////////////////////

/**
 * Send the current game state to all connected clients
 */
function broadcastGameState() {
  // TODO: eventually we may want to send different information to different players
  // with socket.emit('game-state', gameState)
  io.emit('game-state', gameState.publicState)
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on('join-game', (username) => {
    console.log('Assigning username', username, 'to socket', socket.id)
    socketMapping.set(socket.id, username)

    if (gameState.players.hasOwnProperty(username)) {
      console.log('Player', username, 'reconnected')
    } else {
      gameState.addPlayer(username)
    }
    // Update all clients when a player joins
    broadcastGameState()
  })

  // Update the marketplace to have 4 cards
  socket.on('fill-marketplace', () => {
    console.log('Filling marketplace')
    if (gameState.fillMarketplace()) {
      console.log('Marketplace filled successfully')
    } else {
      console.log('No cards left to fill marketplace')
    }
    broadcastGameState()
  })

  // Move a card from the marketplace to a player's hand
  socket.on('pickup-from-marketplace', (cardID) => {
    console.log('Picking up from marketplace', cardID)
    gameState.pickupFromMarketplace(socketMapping.get(socket.id), cardID)
    broadcastGameState()
  })

  // Move a card from the player's hand to their compound, discarding an approprate tool card
  socket.on('add-to-compound-with-discard', (cardIDToMove, cardIDToDiscard) => {
    console.log('Playing card', cardIDToMove, 'by discarding card', cardIDToDiscard)
    if (gameState.buildCard(socketMapping.get(socket.id), cardIDToMove, cardIDToDiscard)) {
      console.log('Built Successfully')
      broadcastGameState()
    } else {
      // TODO: handle else case, return error to client
      console.log('Failed to build card')
    }
  })

  // Activate a card in the player's compound
  socket.on('activate-card', (cardID, diceSelection, cardSelection, energySelection) => {
    if (gameState.activateCard(socketMapping.get(socket.id), cardID, diceSelection, cardSelection, energySelection)) {
      broadcastGameState()
    } else {
      console.log('Failed to activate card')
    }
  })

  // Roll all of the player's available dice
  socket.on('roll-dice', () => {
    gameState.rollDice(socketMapping.get(socket.id))
    broadcastGameState()
  })

  /**
   * Refresh the marketplace with new blueprint cards
   *
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend
   */

  socket.on('refresh-marketplace-blueprints', (resource) => {
    gameState.refreshMarketplaceBlueprints(socketMapping.get(socket.id), resource)
    broadcastGameState()
  })

  // Move a die from the player's dice pool to the headquarters
  socket.on('place-die-in-headquarters', (dieIndex, floor) => {
    gameState.placeDieInHeadquarters(socketMapping.get(socket.id), dieIndex, floor)
    broadcastGameState()
  })

  // Switch between Market phase and Work phase
  socket.on('change-phase', () => {
    // TODO: eventually, transition from Market to Work phase should be automatic
    // TODO: transition from Work to Market phase may require players to discard excess resources
    // so this function may need to accept parameters to allow that
    gameState.changePhase()
    broadcastGameState()
  })

  // Remove a player from the game
  socket.on('quit', () => {
    console.log('Player', socketMapping.get(socket.id), 'has left the game')
    gameState.removePlayer(socketMapping.get(socket.id))
    socket.disconnect()
    broadcastGameState()
  })

  // DEBUG: log unknown events
  var onevent = socket.onevent
  socket.onevent = (packet) => {
    console.log('Received event (', socket.id, '/', socketMapping.get(socket.id), '):', packet.data)
    onevent.call(socket, packet) // original call
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} (${socketMapping.get(socket.id)})`)
    socketMapping.delete(socket.id)
    broadcastGameState()
  })
})

const PORT = process.env.PORT || 3000
gameState
  .init()
  .then(() => {
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
  })
  .catch((error) => {
    console.error('Failed to initialize game state:', error)
  })
