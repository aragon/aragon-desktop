const Web3 = require('web3')
const APM = require('@aragon/apm')
const createProvider = require('./provider')

module.exports = function getCurrentContent () {
  const provider = createProvider()

  // TODO: Make this configurable
  const ensRegistryAddress = '0xfbae32d1cde62858bc45f51efc8cc4fa1415447e'
  const apm = APM(
    new Web3(provider),
    { ensRegistryAddress }
  )

  const { content } = await apm.getLatestVersion(
    'aragon.aragonpm.eth'
  )

  return content
}
