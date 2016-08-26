import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import {ViewState, Collections, PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from './types';

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
        return [0].concat(findLeftmostLeaf(node.items[0]))
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
        return "data:image/" + node.art.format + ";base64," + node.art.data;
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
    playNode: any;
    addNode: any;
}

class AlbumEntry extends React.Component<AlbumEntryProps, any> {
    constructor(props: AlbumEntryProps) {
        super(props);
    }
    render() {
        let dataurl = "album.png";
        if (this.props.album.art) {
            dataurl = "data:image/" + this.props.album.art.format + ";base64," + this.props.album.art.data;
        }
        return (
            <div className="albumEntry">
                <div className="albumArtContainer">
                    <img src={dataurl}></img>
                    <div className="albumControls">
                        <div className="albumControlsPlay" onClick={() => this.props.playNode(this.props.album) }><i className="fa fa-play" aria-hidden="true"></i></div>
                        <div className="albumControlsAdd" onClick={() => this.props.addNode(this.props.album) }><i className="fa fa-plus" aria-hidden="true"></i></div>
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
    playNode: any;
    addNode: any;
    collection: Playlist;
}

function AlbumList(props: AlbumListProps) {
    return (
        <div className="viewList">
            {
                (() => {
                    if (props.collection) {
                        return props.collection.items.map((element: Playlist) =>
                            <AlbumEntry playNode={props.playNode} addNode={props.addNode} album={element}></AlbumEntry>
                        )
                    } else {
                        return [<div>Loading...</div>];
                    }
                })()
            }
        </div>
    );
}

enum AlbumSort {
    byName,
    byDate,
    byArtist,
    byFileDate,
    byDefault
}

interface AlbumViewProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
}
interface AlbumViewState {
    sort: AlbumSort;
}

class AlbumView extends React.Component<AlbumViewProps, AlbumViewState> {

    render() {
        let titleDict = {
            albums: "Alben",
            artists: "Künstler",
            songs: "Songs",
            playlists: "Wiedergabelisten",
            settings: "Einstellungen",
            queue: "Aktuelle Wiedergabe",
        };
        return (
            <div className="view albumView">
                <h1 className="viewTitel">{titleDict.songs}</h1>
                <div className="viewMenu">
                    <div className="playAll">Alle Wiedergeben</div>
                    <DropDownSelector
                        className="sortby"
                        text="Sortierung:"
                        entries={["Albumname", "Veröffentlichungsdatum", "Künstler", "Dateidatum", "Default"]}
                        default={4} />
                    <DropDownSelector
                        className="filter"
                        text="Filter:"
                        entries={["Filter A", "Filter B", "Filter C", "Filter D", "Default"]}
                        default={4} />
                </div>
                <AlbumList collection={this.props.collection} playNode={this.props.playNode} addNode={this.props.addNode}/>
            </div>
        );
    }
}
enum SongSort {
    byName,
    byAlbum,
    byArtist,
    byFileDate,
    byDefault
}
interface SongViewProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
}
interface SongViewState {
    sort: SongSort;
}
class SongView extends React.Component<SongViewProps, SongViewState> {
    render() {
        let titleDict = {
            albums: "Alben",
            artists: "Künstler",
            songs: "Songs",
            playlists: "Wiedergabelisten",
            settings: "Einstellungen",
            queue: "Aktuelle Wiedergabe",
        };
        return (
            <div className="view albumView">
                <h1 className="viewTitel">{titleDict.albums}</h1>
                <div className="viewMenu">
                    <div className="playAll">Alle Wiedergeben</div>
                    <DropDownSelector
                        className="sortby"
                        text="Sortierung:"
                        entries={["Albumname", "Veröffentlichungsdatum", "Künstler", "Dateidatum", "Default"]}
                        default={4} />
                    <DropDownSelector
                        className="filter"
                        text="Filter:"
                        entries={["Filter A", "Filter B", "Filter C", "Filter D", "Default"]}
                        default={4} />
                </div>
                <SongList collection={this.props.collection} playNode={this.props.playNode} addNode={this.props.addNode} />
            </div>
        );
    }
}
interface SongListProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
}

function SongList(props: SongListProps) {
    return (
        <div className="viewList songs">
            {
                (() => {
                    if (props.collection) {
                        return props.collection.items.map((element: Track) =>
                            <SongEntry playNode={props.playNode} addNode={props.addNode} song={element}/>
                        )
                    } else {
                        return [<div>Loading...</div>];
                    }
                })()
            }
        </div>
    );
}
interface SongEntryProps {
    song: Track;
    playNode: any;
    addNode: any;
}

class SongEntry extends React.Component<SongEntryProps, any> {
    render() {
        return (
            <div className="songEntry">

                <div className="text">
                    <div className="title">{this.props.song.title}</div>

                    <div className="artist">
                        <div className="content">{this.props.song.artist}</div>
                        <div className="spacer">
                            <div className="controls">
                                <div className="play" onClick={() => this.props.playNode(this.props.song) }><i className="fa fa-play" aria-hidden="true"></i></div>
                                <div className="add" onClick={() => this.props.addNode(this.props.song) }><i className="fa fa-plus" aria-hidden="true"></i></div>
                            </div>
                        </div>
                    </div>
                    <div className="album">{this.props.song.album}</div>
                    <div className="year">{this.props.song.year}</div>
                    <div className="duration">{"Unknown"}</div>
                </div>
            </div>
        );
    }
}

interface DropDownEntryProps {
    visible: boolean;
    active: boolean;
    text: string;
    clicked: any;
}
function DropDownEntry(props: DropDownEntryProps) {
    let classText = ""
    if (props.visible) {
        classText += "visible ";
    } else {
        classText += "inVisible ";
    }
    if (props.active) {
        classText = "active visible";
    } else {
        classText += "inActive ";
    }
    return (
        <li className={classText} onClick={props.clicked}>{props.text}</li>
    );
}

interface DropDownSelectorProps {
    text: string;
    className: string;
    entries: string[];
    default?: number;
}
interface DropDownSelectorState {
    active: number;
    visible: boolean;
}
class DropDownSelector extends React.Component<DropDownSelectorProps, DropDownSelectorState> {
    state = {
        active: this.props.default ? this.props.default : 0,
        visible: false,
    }

    componentDidMount() {
        let blurhandler = () => {
            window.requestAnimationFrame(blurhandler);
            if (this.state.visible) {
                (ReactDOM.findDOMNode(this.refs["dropdown"]) as HTMLDivElement).focus();
            }
        };
        window.requestAnimationFrame(blurhandler);
    }

    render() {
        let longest = this.props.entries.reduce((pre, cur) => pre.length < cur.length ? cur : pre);
        return (
            <div className={this.props.className}>
                <div className="text">{this.props.text}</div>
                <div className="dropdownWrapper"><div className="spacer">{longest}</div>
                    <div className="helper">
                        <div className={"dropdown " + (this.state.visible ? "visible" : "") }
                            tabIndex="-1"
                            ref="dropdown"
                            onBlur={this.handleClick.bind(this, null) }
                            style={{ top: this.state.visible ? -0.8 * this.state.active + 'em' : 0 }}>
                            <ul>
                                {this.props.entries.map((value, index) =>
                                    <DropDownEntry
                                        visible={this.state.visible ? true : false}
                                        active={index == this.state.active ? true : false}
                                        text={value}
                                        clicked={this.handleClick.bind(this, index) }/>
                                ) }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleClick(index) {
        let state = this.state;
        if (index == null) {
            console.log("onBlur()");
            state.visible = false;
            this.setState(state);
        } else {
            if (state.visible) {
                console.log("onClick()");
                state.visible = false;
                state.active = index;
            } else {
                console.log("onShow()");
                state.visible = true;
            }
        }
        this.setState(state);
    }
}

var albumBox = React.createClass({
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
            if (navigateToNextTrack(this.props.queue, this.props.queueState)) {
                this.props.playerControl(PlayerControl.next);
            } else {
                this.props.playerControl(PlayerControl.pause);
            }
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
                {(this.state.volumeState) ? <VolumeSlider audioPlayer={this.props.audioPlayer} hide={this.hideVolumeSlider.bind(this) }/> : null}
            </div>
        )
    }
}

interface VolumeSliderProps {
    audioPlayer: HTMLAudioElement;
    hide: any;
}
class VolumeSlider extends React.Component<VolumeSliderProps, any> {

    componentDidUpdate() {
        console.log("volumeSlider was called!");
        (ReactDOM.findDOMNode(this.refs["volumeSlider"]) as HTMLDivElement).focus();
    }

    render() {
        let volume = Math.floor(this.props.audioPlayer.volume * 100);
        return (
            <div className="volumeSlider">
                <div><i className="fa fa-volume-up fa-lg" aria-hidden="true"></i></div>
                <div className="volumeTrack">
                    <input type="range" className="slider" tabIndex="0" ref="volumeSlider" onBlur={() => this.props.hide} min="0" max="100" value={volume} onChange={(event: any) => (this.props.audioPlayer.volume = (event.target.value / 100)) }></input>
                </div>
            </div >
        );
    }
}

interface MenuEntryProps {
    collection: Playlist;
    title: string;
    viewState: ViewState;
    viewControl: any;
}
function MenuEntry(props: MenuEntryProps) {
    let state = "inactive";
    if (props.viewState == ViewState[props.title]) {
        state = "active";
    }
    let titleDict = {
        albums: "Alben",
        artists: "Künstler",
        songs: "Songs",
        playlists: "Wiedergabelisten",
        settings: "Einstellungen",
        queue: "Aktuelle Wiedergabe",
    };
    return (
        <div className={"menuEntry " + state}>
            <img className="entryArt" src="album.png" ></img>
            <div className="entryText" onClick={() => props.viewControl(ViewState[props.title]) } >{titleDict[props.title]}</div>
        </div>
    );
}

interface MenuPaneProps {
    collections: Collections;
    viewState: ViewState;
    viewControl: any;
}
class MenuPane extends React.Component<MenuPaneProps, any> {
    render() {
        return (
            <div className="menuPane">
                {Object.keys(this.props.collections).map((e) =>
                    <MenuEntry
                        viewControl={this.props.viewControl}
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
            viewState: ViewState.songs,
            queue: emptyQueue,
            queueState: []
        }
    }

    componentDidMount() {
        ipcRenderer.send('asynchronous-message', this.state.viewState)
        ipcRenderer.on('asynchronous-reply', (event, collections) => {
            let state = this.state;
            state.collections = JSON.parse(collections);
            this.setState(state);
        });
    }

    render() {
        return (
            <div className="windowRoot">
                <div className="windowLeftPane">
                    <MenuPane collections={this.state.collections} viewState={this.state.viewState} viewControl={this.viewControl.bind(this) }/>
                </div>
                <div className="windowRightPane">
                    {(() => {
                        console.log("State:", this.state.viewState)
                        switch (this.state.viewState) {
                            case ViewState.albums:
                                return (<AlbumView playNode={this.playNode.bind(this) } addNode={this.addNode.bind(this) } collection={this.state.collections.albums}/>);
                            case ViewState.artists:
                                return (<AlbumView playNode={this.playNode.bind(this) } addNode={this.addNode.bind(this) } collection={this.state.collections.albums}/>);
                            case ViewState.songs:
                                return (<SongView playNode={this.playNode.bind(this) } addNode={this.addNode.bind(this) } collection={this.state.collections.songs}/>);
                        }
                    })() }

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

    playNode(item: PlaylistNode) {
        this.state.queue.items = [item];
        this.state.queueState = [];

        let track: Track = navigateToFirstTrack(this.state.queue, this.state.queueState);
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    }
    addNode(item: PlaylistNode) {
        let state = this.state;
        console.log(state.queue);
        state.queue.items.push(item);
        console.log(state.queue);
        this.setState(state);
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

    viewControl(view: ViewState) {
        let state = this.state;
        state.viewState = view;
        this.setState(state);
    }

    playerControl(action: PlayerControl) {
        let track: Track;
        let state = this.state;
        let currentState;
        switch (action) {
            case PlayerControl.next:
                currentState = navigateToNextTrack(this.state.queue, this.state.queueState);
                if (!currentState) {
                    currentState = findLeftmostLeaf(this.state.queue)
                }
                break;
            case PlayerControl.previous:
                if (state.audioPlayer.currentTime < 4) {
                    currentState = navigateToPreviousTrack(this.state.queue, this.state.queueState);
                    if (!currentState) {
                        currentState = findRightmostLeaf(this.state.queue)
                    }
                } else {
                    state.audioPlayer.currentTime = 0;
                }
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
    console.log("Master, what are your orders?");
    ReactDOM.render(
        <MukakePlayer />,
        document.getElementById('container')
    );
});

