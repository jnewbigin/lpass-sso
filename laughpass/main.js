// Modules to control application life and create native browser window
const {app, BrowserWindow, session, ipcMain} = require('electron')
const crypto = require('crypto');

const path = require('path')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.

    state = {email: false,
        company_id: false,
        id_token: false,
        k1: false,
        k2: false,
        hidden_master_key : false,
        fragment_id: false,
  };

    if(app.commandLine.hasSwitch('email')) {
        state.email = app.commandLine.getSwitchValue('email')
    }

    ses = session.defaultSession

    ses.webRequest.onBeforeRequest((details, callback) => {
        /*
            We must intercept the oauth redirect and collect the browser fragment
            (This is how the browser plugin works too)
         */
        if(details.url.startsWith('https://accounts.lastpass.com/federated/oidcredirect.html')) {
            consume_fragment(details.url.split("#")[1])
            //callback({ redirectURL: 'file://index.html' })
            mainWindow.loadFile('index.html')
        } else {
            callback({ cancel: false })
        }
    })

    ipcMain.on('company-id', (event, arg) => {
        state.company_id = arg
        event.reply('company-id', 'thanks')
    })

    ipcMain.on('k2', (event, arg) => {
        state.k2 = arg
        event.reply('k2', 'thanks')
        calculate_password()
    })

    ipcMain.on('fragment-id', (event, arg) => {
        state.fragment_id = arg
        event.reply('fragement-id', 'thanks')
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
        if(state.id_token) {
            event.reply('get-stage', 2)
        } else {
            event.reply('get-stage', 1)
        }
    })


    mainWindow.webContents.openDevTools()
    mainWindow.loadFile('index.html')
    //mainWindow.webContents.session.setProxy({proxyRules:"https=127.0.0.1:8888"}, function () {    })
}

function calculate_password() {

    k1 = Buffer.from(state.k1)
    k2 = Buffer.from(state.k2, "base64")

    let k1_view = new Uint8Array(k1)
    let k2_view = new Uint8Array(k2)
    let k = Buffer.alloc(k1.length)
    let k_view = new Uint8Array(k)
    const hash = crypto.createHash('sha256')

    for (var i = 0; i < k1.length; i++) {
        k_view[i] = k1_view[i] ^ k2_view[i];
    }
    hash.update(k_view)

    state.hidden_master_key = hash.digest().toString('base64')
    console.log('PASSWORD:' + state.hidden_master_key)
    console.log('FRAGMENT:' + state.fragment_id)

    app.quit()
}

function consume_fragment(fragment) {
    fragment.split("&").forEach(pram => {
        data = pram.split("=")
        if(data[0] === "access_token") {
            consume_access_token(data[1])
        }
        if(data[0] === "id_token") {
            consume_id_token(data[1])
        }
    });
}

function consume_access_token(jwt) {
    data = jwt.split(".")
    payload = data[1]
    json = JSON.parse(Buffer.from(payload, 'base64').toString())
    state.k1 = json.LastPassK1
}

function consume_id_token(jwt) {
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

