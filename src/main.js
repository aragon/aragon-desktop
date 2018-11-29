const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')
const path = require('path')

const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const { pinAragonCore, pinIpfsResources, purgeUnusedIpfsResources } = require('./lib/ipfs-caching')
const { getLatestFromRepo } = require('./lib/aragon-core')

const instance = IpfsConnector.getInstance()

async function start () {
  // await instance.start()
  const latest = await getLatestFromRepo('aragon.aragonpm.eth')
  pinAragonCore(latest)
  mainWindow.loadURL(`http://localhost:8080/ipfs/${latest}`)
  // mainWindow.loadURL(`http://localhost:3000`)
  pinIpfsResources()
  purgeUnusedIpfsResources()
}

let mainWindow

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  mainWindow = new BrowserWindow({
    title: 'Aragon',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    backgroundColor: '#f7fbfd',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false
    }
  })

  mainWindow.setMenu(null)

  mainWindowState.manage(mainWindow)

  start()

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    instance.stop()
    app.quit()
  }
})