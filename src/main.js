const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')

const { isPortTaken } = require('./lib/util')
const { startIPFSNode } = require('./lib/ipfs-node')
const { registerIPFSProtocol } = require('./lib/ipfs-protocol')

async function start () {
  const running = await isPortTaken(5001)
  if (!running) {
    await startIPFSNode()
  }
  registerIPFSProtocol()
  mainWindow.loadURL(`apm://aragon.aragonpm.eth`)
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

  // alternatively, uncomment the following line to load index.html via
  // 'chrome://brave' to expose additional APIs such as 'chrome.ipcRenderer'
  //mainWindow.loadURL('chrome://brave/' + __dirname + '/index.html');

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})