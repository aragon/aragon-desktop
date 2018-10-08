const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')

const { IpfsConnector } = require('@akashaproject/ipfs-connector')
const { pinAragonCore } = require('./lib/ipfs-caching')
const { getLatestFromRepo } = require('./lib/aragon-core')

const instance = IpfsConnector.getInstance()

async function start () {
  await instance.start()
  const latest = await getLatestFromRepo('aragon.aragonpm.eth')
  pinAragonCore(latest)
  mainWindow.loadURL(`http://localhost:8080/ipfs/${latest}`)
}

let mainWindow

function createWindow () {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  mainWindow = new BrowserWindow({
    title: 'Aragon Core',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
  })

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