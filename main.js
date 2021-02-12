/* eslint-disable no-new */
/* eslint-disable node/no-callback-literal */
/* eslint-disable node/no-path-concat */

const {
  app,
  shell,
  BrowserWindow,
  clipboard,
  screen,
} = require('electron')

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
      show: true,
    })

    this.gameWindow.loadURL(url)
    this.gameWindow.removeMenu()

    /* 
        *** REGISTERS SHORTCUT ***
    */
    const shortcut = require('electron-localshortcut')
    shortcut.register('F1', () => this.gameWindow.loadURL('https://ev.io'))
    shortcut.register('F2', () => this.gameWindow.loadURL(clipboard.readText()))
    shortcut.register('Escape', () => {
      this.gameWindow.webContents.executeJavaScript("document.documentElement.dispatchEvent(new KeyboardEvent('keydown',{'which':'77'}));")
    })
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
      discord.setActivity({
        largeImageKey: 'logo',
        largeImageText: 'EvClient+',
        startTimestamp: Date.now(),
        details: 'EvClient',
        state: 'By Urban'
      })
    })
  }
}



new Start()
