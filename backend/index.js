// node modules
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')

// custom modules
const cards = require('./modules/cards.js')
const gamelogic = require('./modules/gamelogic.js')

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

  // Move a card from the deck into the player's hand
  socket.on('draw-card', () => {
    gameState.drawCard(socket.id)
    broadcastGameState()
  })

  // Update the marketplace to have 4 cards
  socket.on('fill-marketplace', () => {
    console.log('Filling marketplace')
    while (gameState.marketplace.length < 4) {
      const card = gameState.getNextCardFromDeck()
      if (card == null) {
        // Out of cards
        console.log('No cards left to fill marketplace')
        break
      }
      gameState.marketplace.push(card)
    }
    broadcastGameState()
  })

  // Move a card from the marketplace to a player's hand
  socket.on('pickup-from-marketplace', (cardID) => {
    console.log('Picking up from marketplace', cardID)
    const card = cards.removeCardByID(gameState.marketplace, cardID)[0]
    gameState.players[socket.id].hand[cardID] = card
    console.log('Player hand is now', gameState.players[socket.id].hand)
    broadcastGameState()
  })

  // Move a card from the player's hand to their compound
  socket.on('add-to-compound', (cardID) => {
    gameState.moveToCompound(socket.id, cardID)
    broadcastGameState()
  })

  // Move a card from the player's hand to their compound, discarding an approprate tool card
  socket.on('add-to-compound-wtih-discard', (cardIDToMove, cardIDToDiscard) => {
    console.log('Playing card', cardIDToMove, 'by discarding card', cardIDToDiscard)
    // TODO: this will need a lot more validation
    // Client can send anything they want here so need to check cards are actually in the hand
    if (
      cardIDToMove != cardIDToDiscard &&
      gameState.players[socket.id].hand[cardIDToMove].tool === gameState.players[socket.id].hand[cardIDToDiscard].tool
    ) {
      gameState.moveToCompound(socket.id, cardIDToMove)
      gameState.removeFromHand(socket.id, cardIDToDiscard)
      broadcastGameState()
      console.log('Moved Card')
    }
    // TODO: handle else case, return error to client
  })

  // Roll all of the player's available dice
  socket.on('roll-dice', () => {
    const numDice = gameState.players[socket.id].numDice
    for (let i = 0; i < numDice; i++) {
      // Pick a random number from 1-6
      const value = Math.ceil(Math.random() * 6)
      gameState.players[socket.id].dice.push(value)
    }
    gameState.players[socket.id].numDice = 0
    broadcastGameState()
  })

  // Move a die from the player's dice pool to the headquarters
  socket.on('place-die-in-headquarters', (dieIndex, floor) => {
    // TODO: probably move this logic out to gamelogic file
    // Verify that the player actually has this die
    if (typeof dieIndex !== 'number' || dieIndex > gameState.players[socket.id].dice.length || dieIndex < 0) {
      console.log(
        'Invalid die index',
        dieIndex,
        'requested. Player has',
        gameState.players[socket.id].dice.length,
        'dice'
      )
      return
    }

    // Verify that this is a valid floor
    if (!(floor in gameState.players[socket.id].headquarters)) {
      console.log('Invalid floor', floor, 'requested')
      return
    }

    // Verify that this floor is not full
    if (gameState.players[socket.id].headquarters.length >= 3) {
      console.log('Floor', floor, 'is full')
      return
    }

    // Get dice value from index
    const die = gameState.players[socket.id].dice[dieIndex]

    // Only dice 1-3 can be used for "generate", Only dice 4-6 can be used for "mine"
    if ((floor === 'generate' && die > 3) || (floor === 'mine' && die < 4)) {
      console.log('Die value', die, 'cannot be placed in', floor)
      return
    }

    // Remove die from player's dice pool and add it to the headquarters
    console.log('Placing die', die, 'with index', dieIndex, 'in', floor)
    gameState.players[socket.id].dice.splice(dieIndex, 1)

    // Match Bonus: gain an extra resource if you have matching dice values
    // This should cleanly handle X=X->+1 and X=X=X->+2
    const bonus = gameState.players[socket.id].headquarters[floor].includes(die) ? 1 : 0

    // Update player resources based on where dice are placed
    if (floor === 'research') {
      // Draw a card for each die placed on research
      for (let i = 0; i < 1 + bonus; i++) {
        gameState.drawCard(socket.id)
      }
    } else if (floor === 'generate') {
      // Gain energy based on value of die
      gameState.players[socket.id].energy += die + bonus
    } else if (floor === 'mine') {
      // Gain one metal regardless of die value
      gameState.players[socket.id].metal += 1 + bonus
    }

    gameState.players[socket.id].headquarters[floor].push(die)
    broadcastGameState()
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    gameState.removePlayer(socket.id)
    broadcastGameState()
  })

  // Update all clients when a player joins
  broadcastGameState()
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
