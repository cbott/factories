// node modules
import express from 'express'
import * as fs from 'fs'
import http from 'http'
import { Server } from 'socket.io'

// custom modules
import * as gamelogic from './modules/gamelogic.js'
import { rankPlayers } from './modules/helpers.js'

////////// Game State Setup //////////
let savefile = process.argv[2]

let gameState
if (!savefile || !fs.existsSync(savefile)) {
  gameState = new gamelogic.GameState()
  gameState.init()
  console.log('Initialized new game')
  if (savefile) {
    console.log('Setting save location:', savefile)
    gameState.savefile = savefile
  }
} else {
  console.log('Loading existing game from file', savefile)
  gameState = gamelogic.GameState.fromFile(savefile)
}
//////////// Server Setup ////////////
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
})

if (process.env.NODE_ENV === 'production') {
  console.log('Serving static files from frontend/dist')
  app.use('/', express.static('../frontend/dist/'))
}

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
let socketMapping = new Map()
//////////////////////////////////////

/**
 * Send the current game state to all connected clients
 */
function broadcastGameState() {
  io.emit('game-state', gameState.publicState)
}

/**
 * Send a message to all connected clients
 *
 * @param {string} message - The message to send
 * @param {string} type - The type of message (info, warning, error)
 */
function broadcastMessage(message, type = 'info') {
  console.log(`Broadcasting ${type} message: ${message}`)
  io.emit(type, message)
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  /**
   * Checks the result of a game action and emits an error message if it is a GameError
   *
   * @param {any} result - The result of the game action
   * @returns {boolean} - False if result is a GameError, otherwise boolean value of result
   */
  function check(result) {
    if (result instanceof gamelogic.GameError) {
      socket.emit('error', result.message)
      console.log('GameError:', result.message)
      return false
    }
    return Boolean(result)
  }

  socket.on('join-game', (username) => {
    // Prevent user from passing invalid usernames
    if (username.length < 1) {
      console.log('Unable to add player with empty username')
      return
    }
    if (username.length > 15) {
      console.log('Username cannot be longer than 15 characters')
      return
    }
    if (gameState.players[username] !== undefined && !gameState.players.hasOwnProperty(username)) {
      console.log('Reserved name:', username)
      return
    }

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

  // Pick a Blueprint card from the marketplace
  socket.on('pickup-from-marketplace', (cardID) => {
    console.log('Picking up from marketplace', cardID)
    if (check(gameState.pickupFromMarketplace(socketMapping.get(socket.id), cardID))) {
      broadcastGameState()
    }
  })

  // Pick a Contractor card from the marketplace
  socket.on('hire-contractor', (cardTool, cardIDToDiscard, otherPlayerID) => {
    console.log(
      'Hiring contractor with tool',
      cardTool,
      'discarding',
      cardIDToDiscard,
      'and targeting player',
      otherPlayerID,
    )
    if (check(gameState.hireContractor(socketMapping.get(socket.id), cardTool, cardIDToDiscard, otherPlayerID))) {
      broadcastGameState()
    }
  })

  // Move a card from the player's hand to their compound, discarding an approprate tool card
  socket.on('add-to-compound-with-discard', (cardIDToMove, cardIDToDiscard) => {
    console.log('Playing card', cardIDToMove, 'by discarding card', cardIDToDiscard)
    if (check(gameState.buildCard(socketMapping.get(socket.id), cardIDToMove, cardIDToDiscard))) {
      console.log('Built Successfully')
      broadcastGameState()
    }
  })

  // Activate a card in the player's compound
  socket.on(
    'activate-card',
    (cardID, diceSelection, cardSelection, energySelection, rewardSelection, cardToReplicate) => {
      if (
        check(
          gameState.activateCard(
            socketMapping.get(socket.id),
            cardID,
            diceSelection,
            cardSelection,
            energySelection,
            rewardSelection,
            cardToReplicate,
          ),
        )
      ) {
        broadcastGameState()
      }
    },
  )

  // Roll all of the player's available dice
  socket.on('roll-dice', () => {
    if (check(gameState.rollDice(socketMapping.get(socket.id)))) {
      broadcastGameState()
    }
  })

  // Select values for up to 4 dice at the start of the turn instead of rolling
  socket.on('choose-dice', (diceSelection) => {
    console.log('Choosing dice', diceSelection)
    if (check(gameState.chooseDice(socketMapping.get(socket.id), diceSelection))) {
      broadcastGameState()
    }
  })

  // Gain a die with a specific value
  socket.on('gain-dice-value', (value) => {
    console.log('Gaining dice value', value)
    if (check(gameState.gainDiceValue(socketMapping.get(socket.id), value))) {
      broadcastGameState()
    }
  })

  /**
   * Refresh the marketplace with new blueprint or contractor cards
   *
   * @param {string} cardType - 'blueprint' or 'contractor' to determine which type of cards to refresh
   * @param {string} resource - 'metal' or 'energy' to determine which resource to spend
   */

  socket.on('refresh-marketplace', (cardType, resource) => {
    if (check(gameState.refreshMarketplace(socketMapping.get(socket.id), cardType, resource))) {
      broadcastGameState()
    }
  })

  // Move a die from the player's dice pool to the headquarters
  socket.on('place-die-in-headquarters', (dieIndex, floor) => {
    if (check(gameState.placeDieInHeadquarters(socketMapping.get(socket.id), dieIndex, floor))) {
      broadcastGameState()
    }
  })

  // Switch between Market phase and Work phase
  socket.on('change-phase', () => {
    // DEBUG ONLY
    gameState.changePhase()
    broadcastGameState()
  })

  // End a player's Work phase
  socket.on('end-turn', (cards, energy, metal) => {
    let result = gameState.endTurn(socketMapping.get(socket.id), cards, energy, metal)
    if (check(result)) {
      if (result.end === true) {
        // Game has ended
        broadcastMessage(rankPlayers(gameState.players))
      } else if (result.goods && result.buildings && (result.goods.length || result.buildings.length)) {
        // End condition has been met
        let message = 'Final Round!'
        if (result.goods.length) {
          message += ` These players hit the Goods trigger: ${result.goods.join(', ')}`
        }
        if (result.buildings.length) {
          message += ` These players hit the Buildings trigger: ${result.buildings.join(', ')}`
        }
        broadcastMessage(message, 'warning')
      }
      broadcastGameState()
    }
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
