"use strict";
var electron_1 = require('electron');
var electron_2 = require('electron');
var meta_1 = require('../meta');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;
function createWindow() {
    // Create the browser window.
    win = new electron_1.BrowserWindow({ width: 800, height: 600 });
    // and load the index.html of the app.
    win.loadURL("file://" + __dirname + "/index.html");
    // Open the DevTools.
    win.webContents.openDevTools();
    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}
function dispatcher() {
    electron_2.ipcMain.on('asynchronous-message', function (event, arg) {
        meta_1.buildLibrary(meta_1.recursiveReaddirSync("library")).then(function (library) {
            event.sender.send('asynchronous-reply', library);
        });
    });
}
function libraryHelper() {
    meta_1.buildLibrary(meta_1.recursiveReaddirSync("library")).then(console.log);
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createWindow);
electron_1.app.on('ready', dispatcher);
// Quit when all windows are closed.
electron_1.app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here. 
