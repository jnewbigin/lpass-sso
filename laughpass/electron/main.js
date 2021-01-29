// Modules to control application life and create native browser window
const { app, BrowserWindow, session, ipcMain, net } = require('electron')
const crypto = require('crypto')
const { URL, URLSearchParams } = require('url')
const path = require('path')

const startUrl = process.env.ELECTRON_START_URL || "file://" + path.join(__dirname, '../build')

console.log(startUrl)

const state = {
  email: false,
  company_id: false,
  id_token: false,
  k1: false,
  k2: false,
  hidden_master_key: false,
  fragment_id: false
}

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(startUrl, 'preload.js'),
      nodeIntegration: true
    }
  })

  if (app.commandLine.hasSwitch('email')) {
    state.email = app.commandLine.getSwitchValue('email')
  }

  const ses = session.defaultSession

  ses.webRequest.onBeforeRequest((details, callback) => {
    /*
            We must intercept the oauth redirect and collect the browser fragment
            (This is how the browser plugin works too)
         */
    if (details.url.startsWith('https://accounts.lastpass.com/federated/oidcredirect.html')) {
      consumeFragment(details.url.split('#')[1])
      mainWindow.loadURL(path.join(startUrl, 'index.html'))
    } else {
      callback({ cancel: false }) // eslint-disable-line node/no-callback-literal
    }
  })

  ipcMain.on('query-email', (event, arg) => {
    const API = 'https://lastpass.com/lmiapi/login/type?'

    const searchParams = new URLSearchParams({ username: arg })
    const url = new URL(API + searchParams)

    const request = net.request({
      url: url.toString()
    })

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        if (response.statusCode === 200) {
          event.reply('query-email', JSON.parse(chunk))
        }
      })
    })
    request.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`)
    })
    request.setHeader('Content-Type', 'application/json')
    request.end()
  })

  ipcMain.on('query-oidc', (event, arg) => {
    const url = new URL(arg)

    const request = net.request({
      url: url.toString()
    })

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        if (response.statusCode === 200) {
          event.reply('query-oidc', JSON.parse(chunk))
        }
      })
    })
    request.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`)
    })
    request.setHeader('Content-Type', 'application/json')
    request.end()
  })

  ipcMain.on('company-id', (event, arg) => {
    state.company_id = arg
    event.reply('company-id', 'thanks')
  })

  ipcMain.on('get-company-id', (event, arg) => {
    event.reply('get-company-id', state.company_id)
  })

  ipcMain.on('get-id-token', (event, arg) => {
    event.reply('get-id-token', state.id_token)
  })

  ipcMain.on('get-email', (event, arg) => {
    event.reply('get-email', state.email)
  })

  ipcMain.on('get-stage', (event, arg) => {
    if (state.id_token) {
      event.reply('get-stage', 2)
      getKey()
    } else {
      event.reply('get-stage', 1)
    }
  })

  // mainWindow.webContents.openDevTools()
  mainWindow.loadURL(path.join(startUrl, 'index.html'))
  // mainWindow.webContents.session.setProxy({proxyRules:"https=127.0.0.1:8888"}, function () {    })
}

function getKey () {
  const API = 'https://accounts.lastpass.com/federatedlogin/api/v1/getkey'
  const url = new URL(API)

  const payload = { company_id: state.company_id, id_token: state.id_token }

  const request = net.request({
    method: 'POST',
    url: url.toString()
  })

  request.on('response', (response) => {
    response.on('data', (chunk) => {
      if (response.statusCode === 200) {
        const data = JSON.parse(chunk)
        state.k2 = data.k2
        state.fragment_id = data.fragment_id
        calculatePassword()
      }
    })
  })
  request.on('error', (error) => {
    console.log(`ERROR: ${JSON.stringify(error)}`)
  })
  request.setHeader('Content-Type', 'application/json')
  request.write(JSON.stringify(payload))

  request.end()
}

function calculatePassword () {
  if (state.k1 && state.k2) {
    const k1 = Buffer.from(state.k1)
    const k2 = Buffer.from(state.k2, encoding = 'base64') // eslint-disable-line no-undef

    const k1View = new Uint8Array(k1)
    const k2View = new Uint8Array(k2)
    const k = Buffer.alloc(k1.length)
    const kView = new Uint8Array(k)
    const hash = crypto.createHash('sha256')

    for (let i = 0; i < k1.length; i++) {
      kView[i] = k1View[i] ^ k2View[i]
    }
    hash.update(kView)

    state.hidden_master_key = hash.digest().toString('base64')
    console.log('PASSWORD:' + state.hidden_master_key)
    console.log('FRAGMENT:' + state.fragment_id)

    app.quit()
  }
}

function consumeFragment (fragment) {
  fragment.split('&').forEach(pram => {
    const data = pram.split('=')
    if (data[0] === 'access_token') {
      consumeAccessToken(data[1])
    }
    if (data[0] === 'id_token') {
      consumeIdToken(data[1])
    }
  })
}

function consumeAccessToken (jwt) {
  const data = jwt.split('.')
  const payload = data[1]
  const json = JSON.parse(Buffer.from(payload, 'base64').toString())
  state.k1 = json.LastPassK1
}

function consumeIdToken (jwt) {
  state.id_token = jwt
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
