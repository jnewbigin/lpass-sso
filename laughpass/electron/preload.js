const { contextBridge, ipcRenderer } = require('electron')
console.log('running preload')
contextBridge.exposeInMainWorld(
  'electron',
  {
    getStage: () => ipcRenderer.send('get-stage'),
    onGetStage: (func) => {
      ipcRenderer.on('get-stage', (event, ...args) => func(...args))
    },
    getEmail: () => ipcRenderer.send('get-email'),
    onGetEmail: (func) => {
      ipcRenderer.on('get-email', (event, ...args) => func(...args))
    },
    queryEmail: (email) => ipcRenderer.send('query-email', email),
    onQueryEmail: (func) => {
      ipcRenderer.on('query-email', (event, ...args) => func(...args))
    },
    queryOIDC: (url) => ipcRenderer.send('query-oidc', url),
    onQueryOIDC: (func) => {
      ipcRenderer.on('query-oidc', (event, ...args) => func(...args))
    },
    setCompandId: (companyId) => ipcRenderer.send('company-id', companyId)
  }
)
