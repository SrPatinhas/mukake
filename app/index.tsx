import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import {PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from './types';

var albumBox = React.createClass({
    //displayName: "albumBox",
    render: () => {
        return (
            <div className="albumBox">
                Hello, world!This is a albumBox.
            </div>
        );
    }
});

function isTrack(n: PlaylistNode): n is Track {
    return n.type === "track";
}
function isPlaylist(n: PlaylistNode): n is Playlist {
    return n.type === "playlist";
}

interface AlbumEntryProps {
    album: Playlist;
    playAlbum: any;
}

class AlbumEntry extends React.Component<AlbumEntryProps, any> {
    constructor(props: AlbumEntryProps) {
        super(props);
    }
    render() {
        let dataurl = "album.png";
        if (this.props.album.art) {
            dataurl = "data:image/"+this.props.album.art.format+";base64,"+btoa(String.fromCharCode.apply(null, this.props.album.art.data));
        }
        return (
            <div className="albumEntry">
                <div className="albumArtContainer">
                    <img src={dataurl}></img>
                    <div className="albumControls">
                        <div className="albumControlsPlay" onClick={() => this.props.playAlbum(this.props.album)}><i className="fa fa-play" aria-hidden="true"></i></div>
                        <div className="albumControlsAdd"><i className="fa fa-plus" aria-hidden="true"></i></div>
                    </div>
                </div>
                <div className="albumTitle">{this.props.album.title}</div>
                <div className="albumArtist">{this.props.album.artist}</div>
                {this.props.children}
            </div>
        );
    }
}

interface AlbumListProps {
    playAlbum: any;
    collection: Playlist;
}

function AlbumList(props:AlbumListProps) {
    return (
        <div className="albumList">
            {
                (() => {
                    if (props.collection) {
                        console.log(props.collection);
                        return props.collection.items.map((element:Playlist) =>
                            <AlbumEntry playAlbum={props.playAlbum} album={element}></AlbumEntry>
                        )
                    } else {
                        return [<div>Loading...</div>];
                    }
                })()
            }
        </div>
    );
}

enum PlayStatus {
    play,
    pause,
    stop,
    hammertime
}

interface PlayerIndicatorProps {
    position?: number;
    audioPlayer: HTMLAudioElement;
    audioState: PlayStatus;
    togglePlay: any;
}

interface PlayerIndicatorState {
    currentTime: number;
    duration: number;
    track: Track;
    position: number;
}

class PlayerIndicator extends React.Component<PlayerIndicatorProps,PlayerIndicatorState> {
    state = {
            currentTime: 0,
            duration: 0,
            track: undefined,
            position: 0,
        };

    componentDidMount () {
        /*mySound.addEventListener("timeupdate", (event: any) => {
            let state = this.state;
            state.currentTime = Math.floor(event.timeStamp/1000);
            this.setState(state);
        });*/
        let f = () => {
            window.requestAnimationFrame(f);
            let state = this.state;
            if ( Math.floor(this.props.audioPlayer.currentTime) == state.currentTime) return;
            if ( isNaN(this.props.audioPlayer.currentTime) ) return;
            state.currentTime = Math.floor(this.props.audioPlayer.currentTime);
            console.log(state.currentTime);
            this.setState(state);
        };
        window.requestAnimationFrame(f);
        this.props.audioPlayer.addEventListener("durationchange", (event: any) => {
            let state = this.state;
            state.duration = Math.floor(this.props.audioPlayer.duration);
            this.setState(state);
        });
    }

    getPlayText () {
        switch(this.props.audioState) {
            case PlayStatus.play:
                return (<i className="fa fa-pause" aria-hidden="true"></i>);
            default:
                return (<i className="fa fa-play" aria-hidden="true"></i>);
        }
    }

    render () {
        return (
            <div className="playerIndicator">
                <div className="track">
                    <div className="art">
                        <img src="http://placehold.it/300x300"></img>
                    </div>
                    <div className="info">
                        <div className="title">What's up?</div>
                        <div className="artist">Four Non Blondes</div>
                    </div>
                </div>
                <div className="progress">
                <div className="currentTime">{Math.floor(this.state.currentTime/60)}:{this.state.currentTime%60<10?"0"+this.state.currentTime%60:this.state.currentTime%60}</div>
                <input type="range" className="slider" max={this.state.duration} value={this.state.currentTime} onChange={(event:any) => (this.props.audioPlayer.currentTime = event.target.value)}></input>
                <div className="duration">{Math.floor(this.state.duration/60)}:{this.state.duration%60<10?"0"+this.state.duration%60:this.state.duration%60}</div>
                </div>
                <div className="controls">
                <div className="previous button"><i className="fa fa-step-backward" aria-hidden="true"></i></div>
                <div className="playStatus button" onClick={() => {this.props.togglePlay()}}>{this.getPlayText()}</div>
                <div className="next button"><i className="fa fa-step-forward" aria-hidden="true"></i></div>
                <div className="volume button"><i className="fa fa-volume-up" aria-hidden="true"></i></div>
                <div className="repeat button"><i className="fa fa-repeat" aria-hidden="true"></i></div>
                <div className="random button"><i className="fa fa-random" aria-hidden="true"></i></div>
                </div>
            </div>
        )
    }
}

interface MukakePlayerProps {
    
}

interface MukakePlayerState {
    audioPlayer: HTMLAudioElement;
    audioState: PlayStatus;
    collections: Playlist;
    currentPlaylist: Playlist;
    playlistState: number[];
}

class MukakePlayer extends React.Component<MukakePlayerProps,MukakePlayerState> {
    state:MukakePlayerState;

    constructor () {
        super()
        this.state = {audioPlayer: new Audio(), audioState: PlayStatus.stop, collections: null, currentPlaylist: null, playlistState: [] }
    }

    componentDidMount () {
        ipcRenderer.send('asynchronous-message', 'ping')
        ipcRenderer.on('asynchronous-reply', (event, collections) => {
            let state = this.state;
            state.collections = collections;
            this.setState(state);
        });
    }

    render () {
        return (
            <div>
                <AlbumList playAlbum={this.playAlbum.bind(this)} collection={this.state.collections}/>
                <PlayerIndicator audioPlayer={this.state.audioPlayer} audioState={this.state.audioState} togglePlay={this.togglePlay.bind(this)}/>
            </div>
        );
    }

    playAlbum(item: Playlist) {
        let track = item.items[0]
        if (isTrack(track)) {
            this.state.audioPlayer.src = track.uri;
            this.state.audioPlayer.play();
            this.state.audioState = PlayStatus.play;
            this.forceUpdate();
        }
    }

    togglePlay () {
        let state = this.state;
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
    }


}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Master, I am ready!");
    ReactDOM.render(
        <MukakePlayer />,
        document.getElementById('container')
    );
});

