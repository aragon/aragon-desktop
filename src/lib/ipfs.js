const IPFSFactory = require('ipfsd-ctl')

module.exports = function startIPFS () {
  const factory = IPFSFactory.create({ type: 'go' })

  return new Promise((resolve, reject) => {
    factory.spawn({
      disposable: false
    }, function (err, ipfsd) {
      if (err) {
        reject(err)
        return
      }

      let chain = Promise.resolve(ipfsd)
      if (!ipfsd.initialized) {
        chain = initDaemon(ipfsd)
      }

      resolve(chain.then(startDaemon))
    })
  })
}

function startDaemon (daemon) {
  return new Promise((resolve, reject) => {
    daemon.start((err, api) => {
      if (err) {
        reject(err)
      } else {
        resolve(daemon)
      }
    })
  })
}

function initDaemon (daemon) {
  return new Promise((resolve, reject) => {
    daemon.init((err) => {
      if (err) {
        reject(err)
      } else {
        resolve(daemon)
      }
    })
  })
}

