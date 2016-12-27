let path = require('path')
let execFile = require('child_process').execFile
const commonPath = ['node_modules', 'electron-prebuilt', 'dist']
const macPath = ['Brave.app', 'Contents', 'MacOS', 'Brave']
const otherPath = ['brave']
let muonPath = commonPath

muonPath = muonPath.concat(process.platform === 'darwin'
 ? macPath
 : otherPath)

execFile(path.join(...muonPath), ['.'])