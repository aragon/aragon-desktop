let path = require('path')
let execFile = require('child_process').execFile

execFile(path.join('node_modules', 'electron-prebuilt', 'dist', 'brave'), ['.'])