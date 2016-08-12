"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var ReactDOM = require('react-dom');
var electron_1 = require('electron');
var types_1 = require('./types');
function navigateToPlaylistNode(playlist, playlistState) {
    var iterate = function (node, depth) {
        console.log("navstate:", playlistState);
        console.log("navdepth:", depth);
        console.log("navnode:", node);
        if (depth < playlistState.length) {
            if (isPlaylist(node)) {
                return iterate(node.items[playlistState[depth]], ++depth);
            }
            else {
                return null;
            }
        }
        else {
            return node;
        }
    };
    return iterate(playlist, 0);
}
function navigateToTrack(playlist, playlistState) {
    var iterate = function (node, depth) {
        if (isPlaylist(node) && depth < playlistState.length) {
            return iterate(node.items[playlistState[depth]], ++depth);
        }
        if (isTrack(node)) {
            return node;
        }
        return null;
    };
    var track = iterate(playlist, 0);
    return track;
}
function navigateToFirstTrack(playlist, state) {
    var iterate = function (node) {
        if (isPlaylist(node)) {
            state.push(0);
            return iterate(node.items[0]);
        }
        if (isTrack(node)) {
            return node;
        }
    };
    return iterate(playlist);
}
function isTrack(n) {
    return n.type === "track";
}
function isPlaylist(n) {
    return n.type === "playlist";
}
var AlbumEntry = (function (_super) {
    __extends(AlbumEntry, _super);
    function AlbumEntry(props) {
        _super.call(this, props);
    }
    AlbumEntry.prototype.render = function () {
        var _this = this;
        var dataurl = "album.png";
        if (this.props.album.art) {
            dataurl = "data:image/" + this.props.album.art.format + ";base64," + btoa(String.fromCharCode.apply(null, this.props.album.art.data));
        }
        return (React.createElement("div", {className: "albumEntry"}, React.createElement("div", {className: "albumArtContainer"}, React.createElement("img", {src: dataurl}), React.createElement("div", {className: "albumControls"}, React.createElement("div", {className: "albumControlsPlay", onClick: function () { return _this.props.playAlbum(_this.props.album); }}, React.createElement("i", {className: "fa fa-play", "aria-hidden": "true"})), React.createElement("div", {className: "albumControlsAdd"}, React.createElement("i", {className: "fa fa-plus", "aria-hidden": "true"})))), React.createElement("div", {className: "albumTitle"}, this.props.album.title), React.createElement("div", {className: "albumArtist"}, this.props.album.artist), this.props.children));
    };
    return AlbumEntry;
}(React.Component));
function AlbumList(props) {
    return (React.createElement("div", {className: "albumList"}, (function () {
        if (props.collection) {
            console.log(props.collection);
            return props.collection.items.map(function (element) {
                return React.createElement(AlbumEntry, {playAlbum: props.playAlbum, album: element});
            });
        }
        else {
            return [React.createElement("div", null, "Loading...")];
        }
    })()));
}
var albumBox = React.createClass({
    //displayName: "albumBox",
    render: function () {
        return (React.createElement("div", {className: "albumBox"}, "Hello, world!This is a albumBox."));
    }
});
var PlayStatus;
(function (PlayStatus) {
    PlayStatus[PlayStatus["play"] = 0] = "play";
    PlayStatus[PlayStatus["pause"] = 1] = "pause";
    PlayStatus[PlayStatus["stop"] = 2] = "stop";
    PlayStatus[PlayStatus["hammertime"] = 3] = "hammertime";
})(PlayStatus || (PlayStatus = {}));
var PlayerControl;
(function (PlayerControl) {
    PlayerControl[PlayerControl["play"] = 0] = "play";
    PlayerControl[PlayerControl["pause"] = 1] = "pause";
    PlayerControl[PlayerControl["next"] = 2] = "next";
    PlayerControl[PlayerControl["previous"] = 3] = "previous";
    PlayerControl[PlayerControl["repeat"] = 4] = "repeat";
    PlayerControl[PlayerControl["random"] = 5] = "random";
})(PlayerControl || (PlayerControl = {}));
var PlayerIndicator = (function (_super) {
    __extends(PlayerIndicator, _super);
    function PlayerIndicator() {
        _super.apply(this, arguments);
        this.state = {
            current: 0,
            duration: 0
        };
    }
    PlayerIndicator.prototype.componentDidMount = function () {
        var _this = this;
        /*mySound.addEventListener("timeupdate", (event: any) => {
            let state = this.state;
            state.currentTime = Math.floor(event.timeStamp/1000);
            this.setState(state);
        });*/
        var f = function () {
            window.requestAnimationFrame(f);
            var state = _this.state;
            if (Math.floor(_this.props.audioPlayer.currentTime) == state.current)
                return;
            if (isNaN(_this.props.audioPlayer.currentTime))
                return;
            state.current = Math.floor(_this.props.audioPlayer.currentTime);
            console.log(state.current);
            _this.setState(state);
        };
        window.requestAnimationFrame(f);
        this.props.audioPlayer.addEventListener("durationchange", function (event) {
            var state = _this.state;
            state.duration = Math.floor(_this.props.audioPlayer.duration);
            _this.setState(state);
        });
    };
    PlayerIndicator.prototype.getPlayText = function () {
        switch (this.props.audioState) {
            case PlayStatus.play:
                return (React.createElement("i", {className: "fa fa-pause", "aria-hidden": "true"}));
            default:
                return (React.createElement("i", {className: "fa fa-play", "aria-hidden": "true"}));
        }
    };
    PlayerIndicator.prototype.getNearest = function (node, object) {
    };
    PlayerIndicator.prototype.render = function () {
        var _this = this;
        var title = "-/-";
        var artist = "-/-";
        var art = "album.png";
        if (this.props.queueState && this.props.queue && this.props.queue.items.length) {
            var node = navigateToTrack(this.props.queue, this.props.queueState);
            title = node.title;
            artist = node.artist;
            if (node.art) {
                art = "data:image/" + node.art.format + ";base64," + btoa(String.fromCharCode.apply(null, node.art.data));
            }
        }
        var currentTime = Math.floor(this.state.current / 60) + ":" + (this.state.current % 60 < 10 ? "0" + this.state.current % 60 : this.state.current % 60);
        var durationTime = Math.floor(this.state.duration / 60) + ":" + (this.state.duration % 60 < 10 ? "0" + this.state.duration % 60 : this.state.duration % 60);
        return (React.createElement("div", {className: "playerIndicator"}, React.createElement("div", {className: "track"}, React.createElement("div", {className: "art"}, React.createElement("img", {src: art})), React.createElement("div", {className: "info"}, React.createElement("div", {className: "title"}, title), React.createElement("div", {className: "artist"}, artist))), React.createElement("div", {className: "progress"}, React.createElement("div", {className: "currentTime"}, currentTime), React.createElement("input", {type: "range", className: "slider", max: this.state.duration, value: this.state.current, onChange: function (event) { return (_this.props.audioPlayer.currentTime = event.target.value); }}), React.createElement("div", {className: "duration"}, durationTime)), React.createElement("div", {className: "controls"}, React.createElement("div", {className: "previous button", onClick: function () { _this.props.playerControl(PlayerControl.previous); }}, React.createElement("i", {className: "fa fa-step-backward", "aria-hidden": "true"})), React.createElement("div", {className: "playStatus button", onClick: function () { _this.props.togglePlay(); }}, this.getPlayText()), React.createElement("div", {className: "next button", onClick: function () { _this.props.playerControl(PlayerControl.next); }}, React.createElement("i", {className: "fa fa-step-forward", "aria-hidden": "true"})), React.createElement("div", {className: "volume button"}, React.createElement("i", {className: "fa fa-volume-up", "aria-hidden": "true"})), React.createElement("div", {className: "repeat button"}, React.createElement("i", {className: "fa fa-repeat", "aria-hidden": "true"})), React.createElement("div", {className: "random button"}, React.createElement("i", {className: "fa fa-random", "aria-hidden": "true"})))));
    };
    return PlayerIndicator;
}(React.Component));
var MukakePlayer = (function (_super) {
    __extends(MukakePlayer, _super);
    function MukakePlayer() {
        _super.call(this);
        var emptyQueue = { type: "playlist", role: types_1.PlaylistRole.playlist, title: "Current Playlist", artist: "Current User", items: [] };
        this.state = { audioPlayer: new Audio(), audioState: PlayStatus.stop, collections: null, queue: emptyQueue, queueState: [] };
    }
    MukakePlayer.prototype.componentDidMount = function () {
        var _this = this;
        electron_1.ipcRenderer.send('asynchronous-message', 'ping');
        electron_1.ipcRenderer.on('asynchronous-reply', function (event, collections) {
            var state = _this.state;
            state.collections = collections;
            _this.setState(state);
        });
    };
    MukakePlayer.prototype.render = function () {
        return (React.createElement("div", null, React.createElement(AlbumList, {playAlbum: this.playAlbum.bind(this), collection: this.state.collections}), React.createElement(PlayerIndicator, {audioPlayer: this.state.audioPlayer, audioState: this.state.audioState, togglePlay: this.togglePlay.bind(this), playerControl: this.playerControl.bind(this), queueState: this.state.queueState, queue: this.state.queue})));
    };
    MukakePlayer.prototype.playAlbum = function (item) {
        this.state.queue.items = [item];
        this.state.queueState = [];
        var track = navigateToFirstTrack(this.state.queue, this.state.queueState);
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    };
    MukakePlayer.prototype.playTrack = function (track) {
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    };
    MukakePlayer.prototype.togglePlay = function () {
        var state = this.state;
        switch (state.audioState) {
            case PlayStatus.stop:
            case PlayStatus.pause:
                this.state.audioPlayer.play();
                state.audioState = PlayStatus.play;
                break;
            case PlayStatus.play:
                this.state.audioPlayer.pause();
                state.audioState = PlayStatus.pause;
                break;
        }
        this.setState(state);
    };
    MukakePlayer.prototype.playerControl = function (action) {
        switch (action) {
            case PlayerControl.next:
                var findNextTrack_1 = function (node, state, depth) {
                    console.log("queue:", node);
                    console.log("start:", state);
                    console.log("depth:", depth);
                    state[state.length - depth]++;
                    console.log("new state:", state);
                    var nextNode = navigateToPlaylistNode(node, state);
                    console.log("new node", nextNode);
                    if (!nextNode) {
                        state[state.length - depth]--;
                        depth++;
                        state[state.length - depth]++;
                        return findNextTrack_1(node, state, depth);
                    }
                    if (isPlaylist(nextNode)) {
                        return navigateToFirstTrack(nextNode, state);
                    }
                    if (isTrack(nextNode)) {
                        return nextNode;
                    }
                };
                var track = findNextTrack_1(this.state.queue, this.state.queueState, 1);
                this.playTrack(track);
        }
    };
    return MukakePlayer;
}(React.Component));
document.addEventListener('DOMContentLoaded', function () {
    console.log("Master, I am ready!");
    ReactDOM.render(React.createElement(MukakePlayer, null), document.getElementById('container'));
});
