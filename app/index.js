const {ipcRenderer} = require('electron')
const react = require("react")
const reactDOM = require("react-dom")

let mySound;
let progress;

let Hello = react.createClass({
  displayName: 'Hello',
  render: function() {
    return react.createElement("div", null, "Hello ", this.props.name);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  progress = document.getElementById('myBar');
  reactDOM.render(
    react.createElement(Hello, {name: "World"}),
    document.getElementById('container')
  );
});


/*
ipcRenderer.send('asynchronous-message', 'ping')
ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"
})

mySound = new Audio(["file://D:/Musik/ancora.webm"]);
mySound.volume = 0.0;


mySound.addEventListener('durationchange', (event) => {
  progress.max = Math.floor(mySound.duration*1000)
});

mySound.addEventListener('timeupdate', (event) => {
  progress.value = Math.floor(event.timeStamp);
});

mySound.play();
*/