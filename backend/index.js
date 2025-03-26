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

  gameState.addPlayer(socket.id)

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
    gameState.pickupFromMarketplace(socket.id, cardID)
    broadcastGameState()
  })

  // Move a card from the player's hand to their compound, discarding an approprate tool card
  socket.on('add-to-compound-with-discard', (cardIDToMove, cardIDToDiscard) => {
    console.log('Playing card', cardIDToMove, 'by discarding card', cardIDToDiscard)
    if (gameState.buildCard(socket.id, cardIDToMove, cardIDToDiscard)) {
      console.log('Built Successfully')
      broadcastGameState()
    } else {
      // TODO: handle else case, return error to client
      console.log('Failed to build card')
    }
  })

  // Activate a card in the player's compound
  socket.on('activate-card', (cardID, diceSelection, cardSelection, energySelection) => {
    if (gameState.activateCard(socket.id, cardID, diceSelection, cardSelection, energySelection)) {
      broadcastGameState()
    } else {
      console.log('Failed to activate card')
    }
  })

  // Roll all of the player's available dice
  socket.on('roll-dice', () => {
    gameState.rollDice(socket.id)
    broadcastGameState()
  })

  // Move a die from the player's dice pool to the headquarters
  socket.on('place-die-in-headquarters', (dieIndex, floor) => {
    gameState.placeDieInHeadquarters(socket.id, dieIndex, floor)
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

  // DEBUG: log unknown events
  var onevent = socket.onevent
  socket.onevent = (packet) => {
    console.log('Received event:', packet.data)
    onevent.call(socket, packet) // original call
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    gameState.removePlayer(socket.id)
    broadcastGameState()
  })

  // Update all clients when a player joins
  broadcastGameState()
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
