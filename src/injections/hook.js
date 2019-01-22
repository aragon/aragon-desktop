const { ipcRenderer } = require('electron')

// Handle navigation requests from the TouchBar to apps
ipcRenderer.on('navigate-to-app', (_, app) => {
  const clientHash = location.href.split('/')[4]
  const dao = location.href.split('/')[6]
  window.location.href = `http://localhost:8080/ipfs/${clientHash}/#/${dao}/${app}`
})

function findReactProps (el) {
  const internalInstanceKey = Object.keys(el).find(
    (key) => el.hasOwnProperty(key) && key.startsWith('__reactInternalInstance$')
  )
  
  // Element is not a React component
  if (!internalInstanceKey) return {}
  
  const fiberNode = el[internalInstanceKey]
  
  if (!(fiberNode
    && fiberNode.return
    && fiberNode.return.stateNode
    && fiberNode.return.stateNode._reactInternalFiber.return)) {
    // No state for component
    return {}
  }
  
  // Reach for props
  const component = fiberNode.return.stateNode._reactInternalFiber.return
  
  return component.memoizedProps
}

function hook () {
  // We're probably still on the loading screen
  const dao = location.href.split('/')[6]
  if (!dao) {
    console.debug('No DAO open...')
    setTimeout(hook, 500)
    return
  }

  // Find React props for root component
  const props = findReactProps(
    document.getElementById('root').children[0]
  )
  
  // The wrapper is not available yet, so let's try again later
  if (!props.wrapper) {
    console.debug('Wrapper not available, waiting...')
    setTimeout(hook, 500)
    return
  }

  // Send apps to main process over IPC
  props.wrapper.apps.subscribe((apps) => {
    ipcRenderer.send('apps', apps)
  })
}

window.onload = hook
