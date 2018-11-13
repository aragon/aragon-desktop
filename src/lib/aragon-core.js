const Web3 = require('web3')
const APM = require('@aragon/apm')
const provider = require('eth-provider')

async function getLatestFromRepo (repo) {
  // Local
  // const ensRegistryAddress = '0x5f6F7E8cc7346a11ca2dEf8f827b7a0b612c56a1'
  // Rinkeby
  const ensRegistryAddress = '0xfbae32d1cde62858bc45f51efc8cc4fa1415447e'
  const apm = APM(
    new Web3(provider(['injected', 'frame'])),
    { ensRegistryAddress, ipfs: { host: 'localhost', protocol: 'http', port: 5001 } }
  )

  const { content } = await apm.getLatestVersion(repo)
  return content.location
}

module.exports = { getLatestFromRepo }