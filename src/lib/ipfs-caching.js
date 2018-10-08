const url = require('url')
const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const { session } = require('electron')
const Store = require('electron-store')
const store = new Store()

// 7 days is the default expiration time
// if the pinned hash is not accessed
const IPFS_EXPIRATION = 7

const instance = IpfsConnector.getInstance()

const ipfsFilter = {
  urls: ['https://localhost:8080/ipfs/*']
}

function pinAragonCore (newHash) {
  const storedHash = store.get('aragon.aragonpm.eth')
  if (storedHash !== newHash) {
    instance.api.apiClient.pin.add(newHash)
    instance.api.apiClient.pin.rm(storedHash)
    store.set('aragon.aragonpm.eth', newHash)
  }
}

function updateExpiration (hash) {
  const expirationDate = new Date()
  expirationDate.setDate((expirationDate.getDate() + IPFS_EXPIRATION))
  store.set(`${hash}-expiration`, expirationDate.getTime())
}

function pinIpfsResources () {
  session.defaultSession.webRequest.onBeforeSendHeaders(ipfsFilter, (details, cb) => {
    const path = url.parse(details.url).path
    if (path.startsWith('/ipfs/')) {
      const hash = path.split('/')[2]
      // If it has already been pinned, check its expiration and act accordingly
      if (store.has(`${hash}-expiration`)) {
        const hashExpiration = store.get(`${hash}-expiration`)
        if (hashExpiration < new Date().getTime()) {
          instance.api.apiClient.pin.rm(hash)
          store.delete(`${hash}-expiration`)
        } else {
          updateExpiration(hash)
        }
      // If not, pin it and set a new expiration
      } else {
        updateExpiration(hash)
        instance.api.apiClient.pin.add(hash)
      }
    }
    cb({ cancel: false, requestHeaders: details.requestHeaders })
  })
} 

module.exports = { pinAragonCore, pinIpfsResources }