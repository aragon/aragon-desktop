const {
  TouchBar,
  ipcMain
} = require('electron')
const {
  TouchBarLabel,
  TouchBarButton
} = TouchBar

function createTouchBar (win, apps) {
  if (!apps.length) {
    return new TouchBar([
      new TouchBarLabel({ label: 'Loading apps...' })
    ])
  }

  const buttons = apps.filter(
    (app) => app.start_url
  ).map(
    (app) => new TouchBarButton({
      label: app.name,
      click: () => win.webContents.send('navigate-to-app', app.proxyAddress)
    })
  )
  
  return new TouchBar(
    buttons
  )
}

module.exports = function hookTouchBar (win) {
  ipcMain.on('apps', (_, apps) => {
    win.setTouchBar(
      createTouchBar(win, apps)
    )
  })    
}