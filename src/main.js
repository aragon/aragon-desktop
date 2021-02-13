const { app, BrowserWindow, shell } = require('electron')
const log = require('electron-log')
const windowStateKeeper = require('electron-window-state')
const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const menu = require('./lib/menu')
const { getLatestFromRepo } = require('./lib/aragon-core')
const {
  listenAndPinResources,
  pinAragonClientForNetwork,
  purgeUnusedIpfsResources
} = require('./lib/ipfs-caching')
const storage = require('./lib/storage')

log.transports.file.level = 'info'

const PINNED_INITIAL_CLIENT_KEY = 'main:initialClient'

const ipfsInstance = IpfsConnector.getInstance()
let startedIpfs = false

// Put the IPFS binary into the userData
// This avoids collisions if a user already has an IPFS binary installed
const ipfsPath = path.join(app.getPath('userData'), 'go-ipfs')
ipfsInstance.setBinPath(ipfsPath)

// Init IPFS in the userData as well
const ipfsInitPath = path.join(app.getPath('userData'), 'ipfs-init')
ipfsInstance.setIpfsFolder(ipfsInitPath)

async function loadAragonClient () {
  const { hash, network } = await getLatestFromRepo('aragon.aragonpm.eth')
  await pinAragonClientForNetwork(hash, network)

  return hash
}

async function start (mainWindow) {
  try {
    const version = await ipfsInstance.api.apiClient.version()
    log.info(`Detected running instance of IPFS ${version ? `(version: ${version.version})` : ''}, no need to start our own`)
  } catch (e) {
    log.info('Could not detect running instance of IPFS, starting it ourselves...')
    try {
      await ipfsInstance.start()
      startedIpfs = true
    } catch (e) {
      log.error('Could not start IPFS instance')
      log.error(e)
    }
  }

  const pinnedInitial = await storage.get(PINNED_INITIAL_CLIENT_KEY)
  if (!pinnedInitial || !pinnedInitial.isPinned) {
    // Initial run; try to pin the bundled Aragon client to the bundled IPFS node
    const bundledClientPath = path.join(__dirname, '../assets/aragon-client/main')
    let bundledClientHashes
    try {
      bundledClientHashes = await promisify(fs.readdir)(bundledClientPath)
    } catch (e) {
      log.error(`Could not find bundled Aragon client at ${bundledClientPath}`)
      log.error(e)
    }

    if (!Array.isArray(bundledClientHashes)) {
      log.info('No pre-bundled Aragon client found, skipping initial adding to IPFS')
    } else {
      if (bundledClientHashes.length > 1) {
        log.warn('App appears to have bundled more than one Aragon client, adding the first hash found')
      }

      try {
        await promisify(ipfsInstance.api.apiClient.util.addFromFs)(
          path.join(bundledClientPath, bundledClientHashes[0]),
          { recursive: true }
        )
        log.info(`Added bundled Aragon client (${bundledClientHashes[0]}) to IPFS`)
      } catch (e) {
        log.error(`Could not add initial bundled version of Aragon Client (${bundledClientHashes[0]}) to IPFS`)
        log.error(e)
      }

      await pinAragonClientForNetwork(bundledClientHashes[0], 'main')
      await storage.set(PINNED_INITIAL_CLIENT_KEY, { isPinned: true })
    }
  }

  const latestClientHash = await loadAragonClient()
  log.info(`Loading Aragon client (${latestClientHash})...`)
  mainWindow.loadURL(`http://localhost:8080/ipfs/${latestClientHash}`)

  listenAndPinResources()
  await purgeUnusedIpfsResources()
}

function createWindow () {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800
  })

  const mainWindow = new BrowserWindow({
    title: 'Aragon',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    backgroundColor: '#f7fbfd',
    webPreferences: {
      nodeIntegration: false
    }
  })

  mainWindow.setMenu(menu)

  mainWindowState.manage(mainWindow)

  mainWindow.loadURL(`file://${path.join(__dirname, '../assets/loading.html')}`)

  start(mainWindow)

  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => mainWindow.webContents.openDevTools({mode: 'detach'}), 1000)
  }

  // Sniff new windows from anchors and open in external browsers instead
  mainWindow.webContents.on('new-window', function(event, url){
    event.preventDefault();
    log.info(`Opening ${url} in an external browser`)
    shell.openExternal(url)
  });

  // Sniff navigation requests
  const navigationRegex = /https?:\/\/(rinkeby|mainnet).aragon.org\/?/
  mainWindow.webContents.on('will-navigate', async (event, url) => {
    // Handle the navigation ourselves
    event.preventDefault()

    const matchesAragonApp = url.match(navigationRegex)
    if (Array.isArray(matchesAragonApp)) {
      // If we're going to a different network for the client, load it from IPFS instead
      const network = matchesAragonApp[1] // Network is the first capture group

      // In case it takes a while to pin and load, reset to the loading screen
      mainWindow.loadURL(`file://${path.join(__dirname, '../assets/loading.html')}`)

      const latestClientHash = await loadAragonClient()
      log.info(`Navigating app to ${network} via IPFS instead (${latestClientHash})`)
      mainWindow.loadURL(`http://localhost:8080/ipfs/${latestClientHash}`)
    } else {
      // Otherwise, open it in the OS' default browser
      log.info(`Opening ${url} in an external browser`)
      shell.openExternal(url)
    }
  })
}

async function shutdown() {
  if (startedIpfs) {
    log.info(`Quitting IPFS...`)
    try {
      await ipfsInstance.stop()
    } catch (e) {
      log.error('Could not stop IPFS instance on shutdown')
      log.error(e)
    }
  }
  log.info(`Quitting...`)
  app.quit()
}

app.on('ready', createWindow)

if (process.platform === 'darwin') {
  app.on('will-quit', shutdown)
} else {
  app.on('window-all-closed', shutdown)
}
