const url = require('url')
const { protocol } = require('electron')
const { getLatestFromRepo } = require('./aragon-core')

protocol.registerStandardSchemes(['apm'])

const repoCache = {}

function registerIPFSProtocol() {
  protocol.registerHttpProtocol('apm', async (req, cb) => {
    const parsedURL = url.parse(req.url)
    let latest
    if (repoCache[parsedURL.host]) {
      latest = repoCache[parsedURL.host]
    } else {
      latest = await getLatestFromRepo(parsedURL.host)
      repoCache[parsedURL.host] = latest
    }
    
    cb({
      url: `http://localhost:8080/ipfs/${latest}${parsedURL.path}`,
      method: 'GET',
      referrer: req.referrer,
    })
  })
  /*protocol.registerBufferProtocol('apm', async (req, cb) => {
    const parsedURL = url.parse(req.url)
    let latest
    if (repoCache[parsedURL.host]) {
      latest = repoCache[parsedURL.host]
    } else {
      latest = await getLatestFromRepo(parsedURL.host)
      repoCache[parsedURL.host] = latest
    }
    console.log(`http://localhost:8080/ipfs/${latest}`)
    http.get(`http://localhost:8080/ipfs/${latest}`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => cb({ mimeType: 'text/html', data: new Buffer(data) }))
    })
  })*/
}

module.exports = { registerIPFSProtocol }