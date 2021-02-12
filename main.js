/* eslint-disable no-new */
/* eslint-disable node/no-callback-literal */
/* eslint-disable node/no-path-concat */

const {
  app,
  shell,
  BrowserWindow,
  clipboard,
  screen,
  ipcMain
} = require('electron')

const prompt = require('electron-prompt')
class Start {
  constructor () {
    /*
        *** DOES FPS TRICKS ***
    */

    app.commandLine.appendSwitch("ignore-gpu-blacklist");
    app.commandLine.appendSwitch("disable-gpu-vsync");
    app.commandLine.appendSwitch("enable-pointer-lock-options");
    app.commandLine.appendSwitch("enable-quic");
    app.commandLine.appendSwitch("disable-accelerated-video-decode", false);
    app.commandLine.appendSwitch('disable-frame-rate-limit')
    app.commandLine.appendSwitch('use-angle', 'd3d11ond12');
    app.commandLine.appendSwitch('enable-webgl2-compute-context');
    
    /*
        *** CHECKS IF IT WILL OPEN ***
    */

    app.whenReady()
      .then(() => {
        if (app.requestSingleInstanceLock()) {
          this.startRPC()
          this.createWindow('https://ev.io')
        } else console.log('ERROR: More than one Application opened...')
      })
      .catch((error) => console.log(error))
  }
  
  /*
      *** CREATES WINDOW ***
  */

  createWindow (url) {
    this.gameWindow = new BrowserWindow({
      width: screen.getPrimaryDisplay().workAreaSize.width,
      height:  screen.getPrimaryDisplay().workAreaSize.height,
      fullscreen: true,
      show: false,
      webPreferences: {
        preload: (url === 'https://ev.io') ? __dirname + '/preload.js' : null
      }
    })

    this.gameWindow.loadURL(url)
    this.gameWindow.removeMenu()

    this.gameWindow.on('ready-to-show', () => this.gameWindow.show())
    this.gameWindow.webContents.on('will-prevent-unload', (event) => event.preventDefault())
    this.gameWindow.webContents.on('dom-ready', () => {
      this.startUpdater()
    })
    this.gameWindow.webContents.on('new-window', (event, url) => {
      if (new URL(url).hostname !== 'ev.io') {
        event.preventDefault()
        shell.openExternal(url)
      }
    })

    /* 
        *** ASKS FOR USER'S LINK AND JOINS LINK *** 
    */
    
    function getLink() {
      prompt({
        title: "Join a Private game",
        label: "Please enter your Invite link here",
        value: 'https://ev.io',
        inputAttrs: {
            type: "url",
        },
        type: "input"
      }).then((url) => {
        if (new URL(url).hostname.includes('https://ev.io') && new URL(url).pathname.length > 0) {
          this.gameWindow.loadURL(new URL(url))
        }
        else {
          getLink()
        }
      })
    }

    /* 
        *** REGISTERS SHORTCUT ***
    */

    const shortcut = require('electron-localshortcut')
    const shortcutRegister = {
      'F1': () => this.gameWindow.loadURL('https://ev.io'),
      'F2': () => {
        if (typeof clipboard.readText() === 'string') {
          if (clipboard.readText().split('?party=').length > 1) {
            this.gameWindow.loadURL(clipboard.readText())
          }
          else getLink()
        }
        else getLink()
      },
      'F10': () => (this.gameWindow.isMaximized()) ? this.gameWindow.unmaximize(true) : this.gameWindow.maximize(true),
      'F11': () => this.gameWindow.setSimpleFullScreen(!this.gameWindow.isSimpleFullScreen()),
      'F12': () => this.gameWindow.webContents.openDevTools(),
      'CommandOrControl+F5': this.gameWindow.webContents.reloadIgnoringCache(),
      'Alt+F4': () => app.quit()
    }

    Object.keys(shortcutRegister).forEach((keys) => {
      shortcut.register((process.platform === 'darwin' && keys.indexOf('F') === 0) ? 'CommandOrControl+' + keys : keys, shortcutRegister[keys])
    })
  }

  startUpdater () {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.checkForUpdatesAndNotify()

    autoUpdater.once('update-available', () => {
      this.gameWindow.webContents.executeJavaScript(
        'alert("Update is available and will be installed in the background.")'
      )
    })

    autoUpdater.once('update-downloaded', () => {
      this.gameWindow.webContents
        .executeJavaScript('alert("The latest update will be installed now.")')
        .then(() => autoUpdater.quitAndInstall())
        .catch((error) => console.log(error))
    })
  }

  startRPC () {
    const discord = new (require('discord-rpc').Client)({
      transport: 'ipc'
    })
    discord.login({
      clientId: "803733389885833236",
    }).then(() => {
      ipcMain.on('RPC', (event, timeLeft) => {
        discord.setActivity({
          largeImageKey: 'logo',
          largeImageText: 'EvClient +',
          startTimestamp:  new Date().setTime(Date.now() + Number.parseInt(timeLeft)),
          details: 'EvClient +',
          state: 'By Urban'
        })
      })
    })
  }
}



new Start()
