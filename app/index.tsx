import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import {Collections, PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from './types';

function findRightmostLeaf(node: PlaylistNode): number[] {
    if (isTrack(node)) {
        return [];
    }
    if (isPlaylist(node)) {
        let last = node.items.length - 1;
        return [last].concat(findRightmostLeaf(node.items[last]))
    }
}
function findLeftmostLeaf(node: PlaylistNode): number[] {
    if (isTrack(node)) {
        return [];
    }
    if (isPlaylist(node)) {
        return [0].concat(findRightmostLeaf(node.items[0]))
    }
}

function navigateToPreviousTrack(playlist: Playlist, state: number[]): number[] {
    let findPreviousTrack = (node: Playlist, state: number[]) => {
        let firstNode = node.items[state[0]];
        if (isTrack(firstNode)) {
            if ((state[0] - 1) >= 0) {
                return [state[0] - 1].concat(findRightmostLeaf(node.items[state[0] - 1]));
            }
            return null;
        }
        if (isPlaylist(firstNode)) {
            let result = findPreviousTrack(firstNode, state.slice(1));
            if (result == null) {
                return null
            }
            return [state[0]].concat(result);
        }
    }
    return findPreviousTrack(playlist, state);
}
function navigateToNextTrack(playlist: Playlist, state: number[]): number[] {
    let findNextTrack = (node: Playlist, state: number[]): number[] => {
        let firstNode = node.items[state[0]];
        if (isTrack(firstNode)) {
            if ((state[0] + 1) < node.items.length) {
                return [state[0] + 1].concat(findRightmostLeaf(node.items[state[0] + 1]));
            }
            return null;
        }
        if (isPlaylist(firstNode)) {
            let result = findNextTrack(firstNode, state.slice(1));
            if (result == null) {
                return null
            }
            return [state[0]].concat(result);
        }
    }
    return findNextTrack(playlist, state);
}

function navigateToPlaylistNode(playlist: Playlist, playlistState: number[]): PlaylistNode {
    let iterate = (node: PlaylistNode, depth: number): PlaylistNode => {
        if (depth < playlistState.length) {
            if (isPlaylist(node)) {
                let index = playlistState[depth];
                if (index < node.items.length) {
                    return iterate(node.items[index], ++depth);
                }
                return null;
            }
            return null;
        }
        return node;
    };
    return iterate(playlist, 0);
}

function navigateToTrack(playlist: Playlist, playlistState: number[]): Track {
    let iterate = (node: PlaylistNode, depth: number): Track => {
        if (isPlaylist(node) && depth < playlistState.length) {
            return iterate(node.items[playlistState[depth]], ++depth);
        }
        if (isTrack(node)) {
            return node;
        }
        return null;
    };
    let track: Track = iterate(playlist, 0);
    return track;
}

function navigateToFirstTrack(playlist: PlaylistNode, state: number[]): Track {
    let iterate = (node: PlaylistNode): Track => {
        if (isPlaylist(node)) {
            state.push(0);
            return iterate(node.items[0]);
        }
        if (isTrack(node)) {
            return node;
        }
    }
    return iterate(playlist);
}

function navigateToLastTrack(playlist: PlaylistNode, state: number[]): Track {
    let iterate = (node: PlaylistNode): Track => {
        if (isPlaylist(node)) {
            state.push(node.items.length - 1);
            return iterate(node.items[node.items.length - 1]);
        }
        if (isTrack(node)) {
            return node;
        }
    }
    return iterate(playlist);
}

function getArt(playlist: Playlist, playlistState: number[]): any {
    let node = navigateToPlaylistNode(playlist, playlistState);
    if (node.art) {
        return "data:image/" + node.art.format + ";base64," + btoa(String.fromCharCode.apply(null, node.art.data));
    }
    if (playlistState.length == 0) {
        return "art.jpg";
    }
    return getArt(playlist, playlistState.slice(0, playlistState.length - 1));
}


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
            dataurl = "data:image/" + this.props.album.art.format + ";base64," + btoa(String.fromCharCode.apply(null, this.props.album.art.data));
        }
        return (
            <div className="albumEntry">
                <div className="albumArtContainer">
                    <img src={dataurl}></img>
                    <div className="albumControls">
                        <div className="albumControlsPlay" onClick={() => this.props.playAlbum(this.props.album) }><i className="fa fa-play" aria-hidden="true"></i></div>
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

function AlbumList(props: AlbumListProps) {
    return (
        <div className="albumList">
            {
                (() => {
                    if (props.collection) {
                        return props.collection.items.map((element: Playlist) =>
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

enum PlayStatus {
    play,
    pause,
    stop,
    hammertime
}

enum PlayerControl {
    play,
    pause,
    next,
    previous,
    repeat,
    random,
    toggle
}

interface PlayerIndicatorProps {
    position?: number;
    audioPlayer: HTMLAudioElement;
    audioState: PlayStatus;
    togglePlay: any;
    playerControl: any;
    queueState: number[];
    queue: Playlist;
}

interface PlayerIndicatorState {
    current: number;
    duration: number;
    volumeState: boolean;
}

class PlayerIndicator extends React.Component<PlayerIndicatorProps, PlayerIndicatorState> {
    state = {
        current: 0,
        duration: 0,
        volumeState: false,
    };

    componentDidMount() {
        /*mySound.addEventListener("timeupdate", (event: any) => {
            let state = this.state;
            state.currentTime = Math.floor(event.timeStamp/1000);
            this.setState(state);
        });*/
        let f = () => {
            window.requestAnimationFrame(f);
            let state = this.state;
            if (Math.floor(this.props.audioPlayer.currentTime) == state.current) return;
            if (isNaN(this.props.audioPlayer.currentTime)) return;
            state.current = Math.floor(this.props.audioPlayer.currentTime);
            this.setState(state);
        };
        window.requestAnimationFrame(f);
        this.props.audioPlayer.addEventListener("durationchange", (event: any) => {
            let state = this.state;
            state.duration = Math.floor(this.props.audioPlayer.duration);
            this.setState(state);
        });
        this.props.audioPlayer.addEventListener("volumechange", (event: any) => {
            this.forceUpdate();
        });
        this.props.audioPlayer.addEventListener("ended", (event: any) => {
            this.props.playerControl(PlayerControl.next);
        });

    }

    toggleVolumeSlider() {
        console.log("toggling")
        let state = this.state;
        if (state.volumeState) {
            state.volumeState = false;
        } else {
            state.volumeState = true;
        }
        this.setState(state);
    }
    hideVolumeSlider() {
        console.log("hiding now!");
        let state = this.state;
        state.volumeState = false;
        this.setState(state);
    }

    getPlayText() {
        switch (this.props.audioState) {
            case PlayStatus.play:
                return (<i className="fa fa-pause" aria-hidden="true"></i>);
            default:
                return (<i className="fa fa-play" aria-hidden="true"></i>);
        }
    }

    render() {
        var title: string = "";
        var artist: string = "";
        var art: string = "album.png";
        if (this.props.queueState && this.props.queue && this.props.queue.items.length) {
            let node: Track = navigateToTrack(this.props.queue, this.props.queueState);
            title = node.title;
            artist = node.artist;
            art = getArt(this.props.queue, this.props.queueState);
        }
        let currentTime: string = Math.floor(this.state.current / 60) + ":" + (this.state.current % 60 < 10 ? "0" + this.state.current % 60 : this.state.current % 60);
        let durationTime: string = Math.floor(this.state.duration / 60) + ":" + (this.state.duration % 60 < 10 ? "0" + this.state.duration % 60 : this.state.duration % 60);
        return (
            <div className="playerIndicatorWrapper">
                <div className="playerIndicator">
                    <div className="track">
                        <div className="art">
                            <img src={art}></img>
                        </div>
                        <div className="info">
                            <div className="title">{title}</div>
                            <div className="artist">{artist}</div>
                        </div>
                    </div>
                    <div className="progress">
                        <div className="currentTime">{currentTime}</div>
                        <input type="range" className="slider" max={this.state.duration} value={this.state.current} onChange={(event: any) => (this.props.audioPlayer.currentTime = event.target.value) }></input>
                        <div className="duration">{durationTime}</div>
                    </div>
                    <div className="controls">
                        <div className="previous button" onClick={() => { this.props.playerControl(PlayerControl.previous) } }><i className="fa fa-step-backward" aria-hidden="true"></i></div>
                        <div className="playStatus button" onClick={() => { this.props.playerControl(PlayerControl.toggle) } }>{this.getPlayText() }</div>
                        <div className="next button" onClick={() => { this.props.playerControl(PlayerControl.next) } }><i className="fa fa-step-forward" aria-hidden="true"></i></div>
                        <div className="volume button" onClick={(event: any) => { this.toggleVolumeSlider() } }><i className="fa fa-volume-up" aria-hidden="true"></i></div>
                        <div className="repeat button"><i className="fa fa-repeat" aria-hidden="true"></i></div>
                        <div className="random button"><i className="fa fa-random" aria-hidden="true"></i></div>
                    </div>
                </div>
                {(this.state.volumeState)?<VolumeSlider audioPlayer={this.props.audioPlayer} hide={this.hideVolumeSlider.bind(this)}/>:null}
            </div>
        )
    }
}

interface VolumeSliderProps {
    audioPlayer: HTMLAudioElement;
    hide: any;
}
class VolumeSlider extends React.Component<VolumeSliderProps, any> {
    
    componentDidMount() {
        console.log("volumeSlider was called!");
        (ReactDOM.findDOMNode(this.refs["volumeSlider"]) as HTMLDivElement).focus();
    }

    render() {
        let volume = Math.floor(this.props.audioPlayer.volume * 100);
        return (
            <div className="volumeSlider">
                <div><i className="fa fa-volume-up fa-lg" aria-hidden="true"></i></div>
                <div className="volumeTrack">
                    <input type="range" className="slider" tabIndex="-1" ref="volumeSlider" onBlur={() => null /*this.props.hide*/} min="0" max="100" value={volume} onChange={(event: any) => (this.props.audioPlayer.volume = (event.target.value / 100)) }></input>
                </div>
            </div >
        );
    }
}

interface MenuEntryProps {
    collection: Playlist;
    title: string;
    viewState: ViewState;
}
function MenuEntry(props: MenuEntryProps) {
    let state = "inactive";
    if (props.viewState == ViewState[props.title]) {
        state = "active";
    }
    return (
        <div className={"menuEntry " + state}>
            <img className="entryArt" src="album.png" ></img>
            <div className="entryText">{props.title}</div>
        </div>
    );
}

enum ViewState {
    albums,
    artist,
    song,
    playlist,
    settings,
    queue,
}
interface MenuPaneProps {
    collections: Collections;
    viewState: ViewState;
}
class MenuPane extends React.Component<MenuPaneProps, any> {
    render() {
        return (
            <div className="menuPane">
                {Object.keys(this.props.collections).map((e) =>
                    <MenuEntry
                        viewState={this.props.viewState}
                        title={e}
                        collection={this.props.collections ? this.props.collections[e] : null}
                        />
                ) }
            </div>
        );
    }
}

interface MukakePlayerProps {
}
interface MukakePlayerState {
    audioPlayer: HTMLAudioElement;
    audioState: PlayStatus;
    collections: Collections;
    queue: Playlist;
    queueState: number[];
    viewState: ViewState;
}
class MukakePlayer extends React.Component<MukakePlayerProps, MukakePlayerState> {
    state: MukakePlayerState;

    constructor() {
        super()
        let emptyQueue: Playlist = { type: "playlist", role: PlaylistRole.playlist, title: "Current Playlist", artist: "Current User", items: [] };
        this.state = {
            audioPlayer: new Audio(),
            audioState: PlayStatus.stop,
            collections: { albums: null, artists: null, songs: null, playlists: null },
            viewState: ViewState.albums,
            queue: emptyQueue,
            queueState: []
        }
    }

    componentDidMount() {
        ipcRenderer.send('asynchronous-message', 'ping')
        ipcRenderer.on('asynchronous-reply', (event, collections) => {
            let state = this.state;
            state.collections = collections;
            this.setState(state);
        });
    }

    render() {
        return (
            <div className="windowRoot">
                <div className="windowLeftPane">
                    <MenuPane collections={this.state.collections} viewState={this.state.viewState}/>
                </div>
                <div className="windowRightPane">
                    <AlbumList playAlbum={this.playAlbum.bind(this) } collection={this.state.collections.albums}/>
                </div>
                <PlayerIndicator
                    audioPlayer={this.state.audioPlayer}
                    audioState={this.state.audioState}
                    togglePlay={this.togglePlay.bind(this) }
                    playerControl={this.playerControl.bind(this) }
                    queueState={this.state.queueState}
                    queue={this.state.queue} />
            </div>
        );
    }

    playAlbum(item: Playlist) {
        this.state.queue.items = [item];
        this.state.queueState = [];

        let track: Track = navigateToFirstTrack(this.state.queue, this.state.queueState);
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    }

    playTrack(track: Track) {
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    }

    togglePlay() {
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

    playerControl(action: PlayerControl) {
        let track: Track;
        let state = this.state;
        let currentState;
        switch (action) {
            case PlayerControl.next:
                currentState = navigateToNextTrack(this.state.queue, this.state.queueState);
                break;
            case PlayerControl.previous:
                currentState = navigateToPreviousTrack(this.state.queue, this.state.queueState);
                break;
            case PlayerControl.toggle:
                if (state.audioState == PlayStatus.stop || state.audioState == PlayStatus.pause) {
                    this.playerControl(PlayerControl.play);
                }
                else if (state.audioState == PlayStatus.play) {
                    this.playerControl(PlayerControl.pause);
                }
                break;
            case PlayerControl.play:
                this.state.audioPlayer.play();
                state.audioState = PlayStatus.play;
                break;
            case PlayerControl.pause:
                this.state.audioPlayer.pause();
                state.audioState = PlayStatus.pause;
                break;
        }
        if (currentState) {
            state.queueState = currentState;
            track = navigateToTrack(state.queue, state.queueState);
            state.audioPlayer.src = track.uri;
            if (state.audioState == PlayStatus.play) {
                state.audioPlayer.play();
            }
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

