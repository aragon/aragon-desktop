const log= require('electron-log')
const Web3 = require('web3')
const APM = require('@aragon/apm')
const provider = require('eth-provider')
const networks = require('./networks')

IPFS_TIMEOUT = 600000 // 10min

async function getLatestFromRepo (repo) {
  const web3 = new Web3(provider([
    'frame',
    'direct',
    'wss://mainnet.eth.aragon.network/ws'
  ]))
  const network = await web3.eth.net.getNetworkType()

  const networkConfig = networks[network]
  if (! networkConfig && network !== 'local') {
    throw new Error(
      `Could not find network configuration for ${network}. Expected one of: ${Object.keys(networks).join(', ')}`
    )
  }

  const apm = APM(
    web3,
    {
      ensRegistryAddress: networkConfig.ensRegistry,
      ipfs: { host: 'localhost', protocol: 'http', port: 5001 }
    }
  )

  const repoDetails = await apm.getLatestVersion(repo, IPFS_TIMEOUT)
  log.info(`Obtained aragomPM latest content for ${repo}:`, repoDetails)
  return { hash: repoDetails.content.location, network }
}

module.exports = { getLatestFromRepo }
