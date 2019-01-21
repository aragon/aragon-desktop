const { ipcRenderer } = require('electron')

// Handle navigation requests from the TouchBar to apps
ipcRenderer.on('navigate-to-app', (_, app) => {
  const clientHash = location.href.split('/')[4]
  const dao = location.href.split('/')[6]
  window.location.href = `http://localhost:8080/ipfs/${clientHash}/#/${dao}/${app}`
})

function hook () {
  // Find React root
  const root = document.getElementById('root')
  const el = root.children[0]
  const internalInstanceKey = Object.keys(el).find(
    (key) => el.hasOwnProperty(key) && key.startsWith('__reactInternalInstance$')
  )
  
  if (!internalInstanceKey) {
    // Root not found
  }
  
  const fiberNode = el[internalInstanceKey]
  
  if (!(fiberNode
    && fiberNode.return
    && fiberNode.return.stateNode
    && fiberNode.return.stateNode._reactInternalFiber.return)) {
    // Root not found
  }
  
  // Try to determine props
  const component = fiberNode.return.stateNode._reactInternalFiber.return
  const props = component.memoizedProps
  
  // The wrapper is not available yet, so let's try again later
  if (!props.wrapper) {
    console.debug('Wrapper not available, waiting...')
    setTimeout(hook, 500)
  } else {
    props.wrapper.apps.subscribe((apps) => {
      ipcRenderer.send('apps', apps)
    })
  }
}

window.onload = hook
