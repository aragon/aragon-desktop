const { app, BrowserWindow, shell } = require('electron')
const log = require('electron-log')
const windowStateKeeper = require('electron-window-state')
const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const path = require('path')

const { getLatestFromRepo } = require('./lib/aragon-core')
const {
  listenAndPinResources,
  pinAragonClientForNetwork,
  purgeUnusedIpfsResources
} = require('./lib/ipfs-caching')

const ipfsInstance = IpfsConnector.getInstance()
let startedIpfs = false

async function loadAragonClient (network = 'main') {
  const latestHashForNetwork = await getLatestFromRepo('aragon.aragonpm.eth', network)
  await pinAragonClientForNetwork(latestHashForNetwork, network)

  return latestHashForNetwork
}

async function start (mainWindow) {
  try {
    const version = await ipfsInstance.api.apiClient.version()
    log.info(`Detected running instance of IPFS ${version ? `(version: ${version.version})` : ''}, no need to start our own`)
  } catch (e) {
    log.info('Could not detect running instance of IPFS, starting it ourselves...')
    await ipfsInstance.start()
    startedIpfs = true
  }

  log.info('Loading Aragon client...')
  const latestClientHash = await loadAragonClient()
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
    icon: path.join(__dirname, 'app/assets/icon.png'),
    webPreferences: {
      nodeIntegration: false
    }
  })

  mainWindow.setMenu(null)

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
      log.info(`Navigating app to ${network} via IPFS instead`)

      // In case it takes a while to pin and load, reset to the loading screen
      mainWindow.loadURL(`file://${path.join(__dirname, '../assets/loading.html')}`)

      const latestClientHash = await loadAragonClient(network === 'mainnet' ? 'main' : network)
      mainWindow.loadURL(`http://localhost:8080/ipfs/${latestClientHash}`)
    } else {
      // Otherwise, open it in the OS' default browser
      log.info(`Opening ${url} in an external browser`)
      shell.openExternal(url)
    }
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (startedIpfs) {
      ipfsInstance.stop()
    }
    app.quit()
  }
})
