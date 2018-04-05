const {app, protocol, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const mime = require('mime-types')
const startIPFS = require('./lib/ipfs')

protocol.registerStandardSchemes(['aragon'])

// TODO: Get hash from APM
const WRAPPER_IPFS_HASH = 'QmZx3AA2yHWY5UGZLRxq4qMsPk8EBqBtt3KrJaq3vbGZdc'

let ipfsApi
startIPFS()
  .then((daemon) => {
    console.log('node started ok')

    ipfsApi = daemon.api
    app.once('will-quit', () => {
      console.log('shutting down daemon')
      daemon.stop()
    })
    return ipfsApi.pin.add(WRAPPER_IPFS_HASH, { recursive: true })
  }).then((files) => {
    console.log('pinned', files.length, 'files')
    console.log(files)

    if (app.isReady()) {
      createWindow()
    } else {
      app.once('ready', createWindow)
    }
  })
  .catch(console.error)

let win

function createWindow () {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    titleBarStyle: 'hiddenInset',

    webPreferences: {
      nodeIntegration: false,
      preload: path.resolve('./src', 'inject-web3.js')
    }
  })

  protocol.registerStreamProtocol('aragon', (req, cb) => {
    const parsedUrl = url.parse(req.url)
    const file = parsedUrl.path

    cb({
      statusCode: 200,
      headers: {
        'Content-Type': mime.lookup(file)
      },
      data: ipfsApi.files.catReadableStream(WRAPPER_IPFS_HASH + file)
    })
  }, (err) => {
    if (err) console.error(err)
    if (!err) console.log('protocol registered')
  })

  win.loadURL('aragon://wrapper/index.html')

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    win = null
  })
}

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
