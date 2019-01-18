const Web3 = require('web3')
const APM = require('@aragon/apm')
const provider = require('eth-provider')

async function getLatestFromRepo (repo) {
  // Local
  // const ensRegistryAddress = '0x5f6F7E8cc7346a11ca2dEf8f827b7a0b612c56a1'
  // Rinkeby
  // const ensRegistryAddress = '0xfbae32d1cde62858bc45f51efc8cc4fa1415447e'
  // Mainnet
  const ensRegistryAddress = '0x314159265dd8dbb310642f98f50c066173c1259b'
  const apm = APM(
    new Web3(provider(['injected', 'frame'])),
    { ensRegistryAddress, ipfs: { host: 'localhost', protocol: 'http', port: 5001 } }
  )

  const repoDetails = await apm.getLatestVersion(repo)
  console.log(`aragomPM latest content for ${repo}:`, repoDetails)
  return repoDetails.content.location
}

module.exports = { getLatestFromRepo }
