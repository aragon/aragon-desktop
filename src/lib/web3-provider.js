const WebSocketProvider = require('web3-providers-ws')

function createWeb3Provider () {
  // Local
  // return new WebSocketProvider('ws://localhost:8545')
  // Rinkeby
  return new WebSocketProvider('ws://rinkeby.aragon.network:8546')
}

module.exports = { createWeb3Provider }