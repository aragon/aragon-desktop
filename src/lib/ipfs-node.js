const execa = require('execa')
const fs = require('fs')
const path = require('path')
const homedir = require('homedir')()

const ensureIPFSInitialized = async () => {
  if (!fs.existsSync(path.join(homedir, '.ipfs'))) {
    await execa('ipfs', ['init'])
  }
}

const startIPFSNode = () => (
  new Promise(async (resolve) => {
    await ensureIPFSInitialized()
    const ipfsProc = execa('ipfs', ['daemon'])
    ipfsProc.stdout.on('data', (data) => {
      if (data.toString().includes('Daemon is ready')) resolve()
    })
  })
)

module.exports = { startIPFSNode }