const createProvider = require('./lib/provider')

process.once('loaded', () => {
  global.web3 = {
    currentProvider: createProvider()
  }
})
