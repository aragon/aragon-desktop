const url = require('url')
const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const { session } = require('electron')
const storage = require('./storage')

// 7 days is the default expiration time if the pinned hash is not accessed
const IPFS_EXPIRATION = 7

const instance = IpfsConnector.getInstance()

const ipfsFilter = {
  urls: ['https://localhost:8080/ipfs/*']
}

async function pinAragonCore (newHash) {
  const storedHash = storage.get('aragon.aragonpm.eth')
  if (storedHash !== newHash) {
    instance.api.apiClient.pin.add(newHash)
    instance.api.apiClient.pin.rm(storedHash)
    await storage.set('aragon.aragonpm.eth', { hash: newHash })
  }
}

async function updateExpiration (hash) {
  const expirationDate = new Date()
  expirationDate.setDate((expirationDate.getDate() + IPFS_EXPIRATION))
  await storage.set(hash, { expiration: expirationDate.getTime() })
}

async function purgeUnusedIpfsResources () {
  const keys = await storage.keys()
  for (const key of keys) {
    const data = await storage.get(key)
    if (data.expiration) {
      if (data.expiration < new Date().getTime()) {
        instance.api.apiClient.pin.rm(hash)
        await storage.delete(hash)
      }
    }
  }
}

function pinIpfsResources () {
  session.defaultSession.webRequest.onBeforeSendHeaders(ipfsFilter, (details, cb) => {
    const path = url.parse(details.url).path
    if (path.startsWith('/ipfs/')) {
      const hash = path.split('/')[2]
      if (!storage.has(hash)) {
        instance.api.apiClient.pin.add(hash)
      }
      updateExpiration(hash)
    }
    cb({ cancel: false, requestHeaders: details.requestHeaders })
  })
} 

module.exports = { pinAragonCore, pinIpfsResources, purgeUnusedIpfsResources }