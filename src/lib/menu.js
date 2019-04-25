const { Menu, shell } = require('electron')

const template = [
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'help',
    submenu: [{
      label: 'Join the chat',
      click () {
        shell.openExternal('https://aragon.chat')
      }
    }, {
      label: 'Suggest a new feature',
      click () {
        shell.openExternal('https://github.com/aragon/aragon/issues/new?template=feature_request.md')
      }
    }, {
      label: 'Report a bug',
      click () {
        shell.openExternal('https://github.com/aragon/aragon/issues/new?template=bug_report.md')
      }
    }, {
      label: 'Learn More',
      click () { 
        shell.openExternal('https://aragon.org') 
      }
    }]
  }
]

const menu = Menu.buildFromTemplate(template)

module.exports = menu
