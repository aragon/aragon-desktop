const url = require('url')
const { promisify } = require('util')
const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const { session } = require('electron')
const log = require('electron-log')
const storage = require('./storage')

// 7 days is the default expiration time if the pinned hash is not accessed
const IPFS_EXPIRATION = 7

const ipfsInstance = IpfsConnector.getInstance()
const ipfsPinAdd = promisify(ipfsInstance.api.apiClient.pin.add)
const ipfsPinRm = promisify(ipfsInstance.api.apiClient.pin.rm)

const ipfsFilter = {
  urls: ['https://localhost:8080/ipfs/*']
}

// Note the storage layout for our IPFS cache:
//   - mainnet:aragon.aragonpm.eth -> { hash }
//   - rinkeby:aragon.aragonpm.eth -> { hash }
//   - <hash> -> { hash, expiration }

async function pinAragonClientForNetwork (newHash, network) {
  const storageKey = `${network}:aragon.aragonpm.eth`
  const { hash: storedHash } = await storage.get(storageKey)
  if (storedHash !== newHash) {
    log.debug(`Pinning new client hash for ${network}: ${newHash}`)

    try {
      await ipfsPinAdd(newHash)
    } catch (e) {
      log.error(`Could not pin new client hash for ${network}: ${newHash}`)
      log.error(e)
      return
    }

    if (storedHash) {
      log.debug(`Removing old client hash for ${network}: ${storedHash}`)
      try {
        await ipfsPinRm(storedHash)
      } catch (e) {
        log.error(`Could not unpin old client hash for ${network}: ${storedHash}`)
        log.error(e)
      }
    }
    await storage.set(storageKey, { hash: newHash })
    log.info(`Pinned new client hash for ${network}: ${newHash}`)
  }
}

async function updateExpiration (hash) {
  const expirationDate = new Date()
  expirationDate.setDate((expirationDate.getDate() + IPFS_EXPIRATION))
  log.debug(`Updating expiration date for ${hash}: ${expirationDate}`)
  await storage.set(hash, { hash, expiration: expirationDate.getTime() })
}

async function purgeUnusedIpfsResources () {
  const keys = await storage.keys()
  for (const key of keys) {
    const data = await storage.get(key)
    if (data.hash && data.expiration && data.expiration < new Date().getTime()) {
      log.debug(`Purging unused IPFS resource: ${data.hash}`)
      try {
        await ipfsPinRm(data.hash)
        await storage.delete(key)
      } catch (e) {
        log.error(`Could not unpin unused IPFS resource: ${data.hash}`)
        log.error(e)
      }
    }
  }
  log.info('Purged old IPFS resources')
}

function listenAndPinResources () {
  session.defaultSession.webRequest.onBeforeSendHeaders(ipfsFilter, async (details, cb) => {
    const path = url.parse(details.url).path
    if (path.startsWith('/ipfs/')) {
      const hash = path.split('/')[2]
      if (!(await storage.has(hash))) {
        try {
          await ipfsPinAdd(hash)
        } catch (e) {
          log.error(`Could not pin to new IPFS resource: ${hash}`)
          log.error(e)
        }
      }
      await updateExpiration(hash)
      log.info('Pinned new IPFS resource:', hash)
    }
    cb({ cancel: false, requestHeaders: details.requestHeaders })
  })
}

module.exports = { listenAndPinResources, pinAragonClientForNetwork, purgeUnusedIpfsResources }
