const log= require('electron-log')
const Web3 = require('web3')
const APM = require('@aragon/apm')
const provider = require('eth-provider')
const networks = require('./networks')

IPFS_TIMEOUT = 600000 // 10min

async function getLatestFromRepo (repo) {
  const web3 = new Web3(provider())
  const network = await web3.eth.net.getNetworkType()

  const networkConfig = networks[network]
  if (!networks[network] && network !== 'local') {
    throw new Error(
      `Could not find network configuration for ${network}. Expected one of: ${Object.keys(networks).join(', ')}`
    )
  }

  const apm = APM(
    new Web3(provider([networkConfig.defaultNode])),
    {
      ensRegistryAddress: networkConfig.ensRegistry,
      ipfs: { host: 'localhost', protocol: 'http', port: 5001 }
    }
  )

  const repoDetails = await apm.getLatestVersion(repo, IPFS_TIMEOUT)
  log.info(`Obtained aragomPM latest content for ${repo}:`, repoDetails)
  return repoDetails.content.location
}

module.exports = { getLatestFromRepo }
