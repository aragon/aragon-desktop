const Web3 = require('web3')
const APM = require('@aragon/apm')
const createProvider = require('./provider')

module.exports = async function getCurrentContent (name) {
  const provider = createProvider()

  // TODO: Make this configurable
  const ensRegistryAddress = '0xfbae32d1cde62858bc45f51efc8cc4fa1415447e'
  const apm = APM(
    new Web3(provider),
    { ensRegistryAddress, ipfs: { host: 'localhost', protocol: 'http', port: 5001 } }
  )

  const { content } = await apm.getLatestVersion(
    name
  )

  return content
}
