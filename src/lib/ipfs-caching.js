const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const Store = require('electron-store')
const store = new Store()

const instance = IpfsConnector.getInstance()

function pinAragonCore (newHash) {
  const storedHash = store.get('aragon.aragonpm.eth')
  if (storedHash !== newHash) {
    instance.api.apiClient.pin.add(newHash)
    instance.api.apiClient.pin.rm(storedHash)
    store.set('aragon.aragonpm.eth', newHash)
  }
}

module.exports = { pinAragonCore }