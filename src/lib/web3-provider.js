const WebSocketProvider = require('web3-providers-ws')

function createWeb3Provider () {
  // Local
  // return new WebSocketProvider('ws://localhost:8545')
  // Rinkeby
  return new WebSocketProvider('wss://rinkeby.eth.aragon.network/ws')
}

module.exports = { createWeb3Provider }