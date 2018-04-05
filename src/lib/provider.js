const WebSocketProvider = require('web3-providers-ws')

module.exports = function createProvider () {
  return new WebSocketProvider('ws://rinkeby.aragon.network:8546')
}
