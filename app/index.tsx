///<reference path="../typings/index.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Perf from 'react-addons-perf';
import {ipcRenderer} from 'electron';
import {ViewState, Collections, PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from '../types';

window["Perf"] = Perf;

function findRightmostLeaf(node: PlaylistNode): number[] {
    let findRightmostLeaf = (node: PlaylistNode) => {
        if (!node) {
            return null;
        }
        if (isTrack(node)) {
            return [];
        }
        if (isPlaylist(node)) {
            let last = node.items.length - 1;
            return [last].concat(findRightmostLeaf(node.items[last]))
        }
    }
    let result = findRightmostLeaf(node);
    if (result && result[result.length - 1] == null) {
        return null;
    }
    return result;
}
function findLeftmostLeaf(node: PlaylistNode): number[] {
    let findLeftmostLeaf = (node: PlaylistNode) => {
        if (!node) {
            return null;
        }
        if (isTrack(node)) {
            return [];
        }
        if (isPlaylist(node)) {
            return [0].concat(findLeftmostLeaf(node.items[0]))
        }
    }
    let result = findLeftmostLeaf(node);
    if (result && result[result.length - 1] == null) {
        return null;
    }
    return result;
}

function findPreviousTrack(playlist: Playlist, state: number[]): number[] {
    let findPreviousTrack = (playlist: Playlist, state: number[]) => {
        let parentState = state.slice(0, -1);
        let parentNode = getPlaylistNode(playlist, parentState);
        let parentPosition = state[state.length - 1];
        // is there a next track on this level? return next track else call self on parent level
        if (isPlaylist(parentNode) && 0 <= (parentPosition - 1)) {
            let item = parentNode.items[parentPosition - 1]
            if (isTrack(item)) {
                return parentState.concat([parentPosition - 1]);
            }
            if (isPlaylist(item)) {
                return parentState.concat([parentPosition - 1], findRightmostLeaf(item));
            }
        }
        else if (isPlaylist(parentNode) && parentState.length > 0) {
            return findPreviousTrack(playlist, parentState);
        }
        else if (isPlaylist(parentNode) && parentState.length == 0) {
            return findRightmostLeaf(parentNode);
        }
    }
    let result = findPreviousTrack(playlist, state);
    if (result && result[result.length - 1] == null) {
        return null;
    }
    return result;
}
function findNextTrack(playlist: Playlist, state: number[]): number[] {
    let findNextTrack = (playlist: Playlist, state: number[]) => {
        let parentState = state.slice(0, -1);
        let parentNode = getPlaylistNode(playlist, parentState);
        let parentPosition = state[state.length - 1];
        // is there a next track on this level? return next track else call self on parent level
        if (isPlaylist(parentNode) && parentNode.items.length > (parentPosition + 1)) {
            let item = parentNode.items[parentPosition + 1]
            if (isTrack(item)) {
                return parentState.concat([parentPosition + 1]);
            }
            if (isPlaylist(item)) {
                return parentState.concat([parentPosition + 1], findLeftmostLeaf(item));
            }
        }
        else if (isPlaylist(parentNode) && parentState.length > 0) {
            return findNextTrack(playlist, parentState);
        }
        else if (isPlaylist(parentNode) && parentState.length == 0) {
            return findLeftmostLeaf(parentNode);
        }
    }
    let result = findNextTrack(playlist, state);
    if (result && result[result.length - 1] == null) {
        return null;
    }
    return result;
}

function getPlaylistNode(node: PlaylistNode, state: number[]): PlaylistNode {
    if (isPlaylist(node) && state.length > 0) {
        let item = node.items[state[0]];
        if (isPlaylist(node)) {
            return getPlaylistNode(item, state.slice(1));
        }
    }
    return node;
}

function getTrack(playlist: Playlist, playlistState: number[]): Track {
    let node = getPlaylistNode(playlist, playlistState);
    if (isTrack(node)) {
        return node;
    }
}

function getFirstTrack(node: PlaylistNode): Track {
    if (isTrack(node)) {
        return node;
    }
    if (isPlaylist(node)) {
        return getTrack(node, findLeftmostLeaf(node));
    }
}

function getLastTrack(node: PlaylistNode): Track {
    if (isTrack(node)) {
        return node;
    }
    if (isPlaylist(node)) {
        return getTrack(node, findRightmostLeaf(node));
    }
}


function getArt(playlist: Playlist, playlistState: number[]): any {
    let node = getPlaylistNode(playlist, playlistState);
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
function isString(x: any): x is string {
    return typeof x === "string";
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
            <div className="entry">
                <div className="art">
                    <img src={dataurl}></img>
                    <div className="controls">
                        <div className="play" onClick={() => this.props.playNode(this.props.album) }><i className="fa fa-play" aria-hidden="true"></i></div>
                        <div className="add" onClick={() => this.props.addNode(this.props.album) }><i className="fa fa-plus" aria-hidden="true"></i></div>
                    </div>
                </div>
                <div className="title">{this.props.album.title}</div>
                <div className="artist">{this.props.album.artist}</div>
            </div>
        );
    }
}

interface AlbumListProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
    sort: Sorts;
}
class AlbumList extends React.Component<AlbumListProps, any> {
    renderSorted(sortFunction: any) {
        if (this.props.collection) {
            let sortedCollection = sortFunction(this.props.collection.items);
            return (
                <div className="sorted">{
                    sortedCollection.keys.map((entry) => (
                        <div className="seperator">
                            <div className="index">{entry}</div>
                            <div className="entries">
                                {sortedCollection.sections[entry].map((element: Playlist) => (
                                    <AlbumEntry playNode={this.props.playNode} addNode={this.props.addNode} album={element}/>))
                                }
                            </div>
                        </div>
                    )) }
                </div>
            );
        }
        else {
            return (<div>Loading...</div>);
        }
    }

    renderUnsorted() {
        return (
            <div className="unsorted">{
                this.props.collection.items.map((element: Playlist) =>
                    <AlbumEntry playNode={this.props.playNode} addNode={this.props.addNode} album={element}/>
                ) }
            </div>
        );
    }

    renderSwitch() {
        switch (this.props.sort) {
            case Sorts.byArtist:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierArtist)));
            case Sorts.byTitle:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierTitleChar)));
            case Sorts.bySong:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierSong)));
            case Sorts.byDate:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierDate)));
            case Sorts.byFileDate:
            case Sorts.byDefault:
                return (this.renderUnsorted());
        };
    }
    render() {
        if (this.props.collection) {
            return (
                <div className="viewList albums">
                    {this.renderSwitch() }
                </div>
            );
        }
        return (<div>Loading...</div>);
    }
}


function AlbumList2(props: AlbumListProps) {
    return (
        <div className="viewList albums">
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

enum Sorts {
    byTitle,
    bySong,
    byAlbum,
    byArtist,
    byDate,
    byFileDate,
    byDefault
}
enum Filters {
    filterA,
    filterB,
    filterC,
    filterD,
    filterDefault
}
let SortsString = {
    bySong: "Songname",
    byAlbum: "Albumname",
    byDate: "Veröffentlichungsdatum",
    byArtist: "Künstler",
    byFileDate: "Dateidatum",
    byDefault: "Default"
}
let filterSortString = {
    filterA: "filter A",
    filterB: "filter B",
    filterC: "filter C",
    filterD: "filter D",
    filterDefault: "Default"
}

interface SortViewProps {
    loadState: () => void;
    saveState: (state: {}) => {};
}
interface SortViewState {
    sort: Sorts;
}
abstract class SortView<P extends SortViewProps, S extends SortViewState> extends React.Component<P, S> {
    constructor(props?: P, context?: S) {
        super();
    }
    componentDidMount() {
        let savedState = this.props.loadState();
        (Object as any).assign(this.state, savedState);
        this.forceUpdate();
    }
    componentDidUpdate() {
        this.props.saveState(this.state);
    }
    setSorts(sort: Sorts) {
        this.state.sort = sort;
        this.props.saveState(this.state)
        this.forceUpdate();
    }
    setFilters() {
        return null;
    }
}
interface AlbumViewProps extends SortViewProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
}
interface AlbumViewState extends SortViewState { }
class AlbumView extends SortView<AlbumViewProps, AlbumViewState> {
    state = { sort: Sorts.byDefault, filter: Filters.filterDefault };
    render() {
        return (
            <div className="view albumView">
                <h1 className="viewTitel">{getLocalized("albums") }</h1>
                <div className="viewMenu">
                    <div className="playAll" onClick={() => this.props.playNode(this.props.collection) }>Alle Wiedergeben</div>
                    <DropDownSelector
                        className="sortby"
                        text="Sortierung:"
                        collection={this.props.collection}
                        selectorMap={[
                            [Sorts.byArtist, SortsString.byArtist],
                            [Sorts.byTitle, SortsString.byAlbum],
                            [Sorts.byDate, SortsString.byDate],
                            [Sorts.byFileDate, SortsString.byFileDate],
                            [Sorts.byDefault, SortsString.byDefault],
                        ]}
                        default={this.state.sort}
                        setter={this.setSorts.bind(this) } />
                    <DropDownSelector
                        className="filter"
                        text="Filter:"
                        collection={this.props.collection}
                        selectorMap={[
                            [Filters.filterA, filterSortString.filterA],
                            [Filters.filterB, filterSortString.filterB],
                            [Filters.filterC, filterSortString.filterC],
                            [Filters.filterD, filterSortString.filterD],
                            [Filters.filterDefault, filterSortString.filterDefault],
                        ]}
                        default={this.state.filter}
                        setter={this.setFilters.bind(this) } />
                </div>
                <AlbumList sort={this.state.sort} collection={this.props.collection} playNode={this.props.playNode} addNode={this.props.addNode}/>
            </div>
        );
    }
}

interface SongViewProps extends SortViewProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
}
interface SongViewState extends SortViewState { }
class SongView extends SortView<SongViewProps, SongViewState> {
    state = { sort: Sorts.byDefault, filter: Filters.filterDefault };
    render() {
        return (
            <div className="view albumView">
                <h1 className="viewTitel">{getLocalized("songs") }</h1>
                <div className="viewMenu">
                    <div className="playAll" onClick={() => this.props.playNode(this.props.collection) }>Alle Wiedergeben</div>
                    <DropDownSelector
                        className="sortby"
                        text="Sortierung:"
                        collection={this.props.collection}
                        selectorMap={[
                            [Sorts.bySong, SortsString.bySong],
                            [Sorts.byArtist, SortsString.byArtist],
                            [Sorts.byAlbum, SortsString.byAlbum],
                            [Sorts.byDate, SortsString.byDate],
                            [Sorts.byFileDate, SortsString.byFileDate],
                            [Sorts.byDefault, SortsString.byDefault],
                        ]}
                        default={this.state.sort}
                        setter={this.setSorts.bind(this) } />
                    <DropDownSelector
                        className="filter"
                        text="Filter:"
                        collection={this.props.collection}
                        selectorMap={[
                            [Filters.filterA, filterSortString.filterA],
                            [Filters.filterB, filterSortString.filterB],
                            [Filters.filterC, filterSortString.filterC],
                            [Filters.filterD, filterSortString.filterD],
                            [Filters.filterDefault, filterSortString.filterDefault],
                        ]}
                        default={this.state.filter}
                        setter={this.setFilters.bind(this) } />
                </div>
                <SongList collection={this.props.collection} playNode={this.props.playNode} addNode={this.props.addNode} sort={this.state.sort}/>
            </div>
        );
    }
}

interface SortedCollection {
    keys: String[];
    sections: {};
}

function identifierFirstChar(id: string, node: PlaylistNode): string {
    return node[id].charAt(0).toUpperCase();
}
function identifierArtist(node: PlaylistNode): string {
    return node["artist"]
}
function identifierAlbum(node: PlaylistNode): string {
    return node["album"];
}
function identifierTitleChar(node: PlaylistNode): string {
    return identifierFirstChar("title", node);
}
function identifierSong(node: PlaylistNode): string {
    return identifierFirstChar("title", node);
}
function identifierDate(node: PlaylistNode): string {
    return node["year"].toString();
}

function sortByAlphabet(identifier: any, items: PlaylistNode[]): SortedCollection {
    let keys = [];
    let sections = {};
    for (let node of items) {
        let firstChar = identifier(node);
        if (firstChar in sections) {
            sections[firstChar].push(node);
        }
        else {
            sections[firstChar] = [node];
            keys.push(firstChar);
        }
    }
    keys.sort();
    return { keys: keys, sections: sections };
}

interface SongListProps {
    playNode: any;
    addNode: any;
    collection: Playlist;
    sort: Sorts;
}

class SongList extends React.Component<SongListProps, any> {
    renderSorted(sortFunction: any) {
        if (this.props.collection) {
            let sortedCollection = sortFunction(this.props.collection.items);
            return (
                sortedCollection.keys.map((entry, indexA) => (
                    <div className="seperator">
                        <div className="index">{entry}</div>
                        <div className="entries">
                            {sortedCollection.sections[entry].map((element: Track, indexB) => (
                                <SongEntry playNode={this.props.playNode} addNode={this.props.addNode} song={element} id={"id" + indexA + "-" + indexB}/>))
                            }
                        </div>
                    </div>
                ))
            );
        }
        else {
            return ([<div>Loading...</div>]);
        }
    }

    renderUnsorted() {
        return this.props.collection.items.map((element: Track, indexA) =>
            <SongEntry playNode={this.props.playNode} addNode={this.props.addNode} song={element} id={"id" + indexA}/>
        );
    }

    renderSwitch() {
        switch (this.props.sort) {
            case Sorts.byArtist:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierArtist)));
            case Sorts.byAlbum:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierAlbum)));
            case Sorts.bySong:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierSong)));
            case Sorts.byDate:
                return (this.renderSorted(sortByAlphabet.bind(undefined, identifierDate)));
            case Sorts.byFileDate:
            case Sorts.byDefault:
                return (this.renderUnsorted());
        };
    }
    render() {
        if (this.props.collection) {
            return (
                <div className="viewList songs">
                    {this.renderSwitch() }
                </div>
            );
        }
        return (<div>Loading...</div>);
    }
}


interface SongEntryProps {
    song: Track;
    playNode: any;
    addNode: any;
    id?: string;
    active?: string;
}
function formatSeconds(input: number) {
    var minutes = Math.floor(input / 60);
    var seconds = input % 60;
    return (
        (minutes < 10 ? "0" : "") + minutes + ':' +
        (seconds < 10 ? "0" : "") + seconds
    );
}
class SongEntry extends React.Component<SongEntryProps, any> {
    render() {
        return (
            <div className={"entry" + (this.props.active == "active" ? " active" : "") }>
                <div className="selector"><input type="checkbox" id={this.props.id}/><label htmlFor={this.props.id}></label></div>
                <div className="title">{this.props.song.title}</div>
                <div className="controls">
                    <div className="wrapper">
                        <div className="container">
                            <div className="play" onClick={() => this.props.playNode(this.props.song) }><i className="fa fa-play" aria-hidden="true"></i></div>
                            <div className="add" onClick={() => this.props.addNode(this.props.song) }><i className="fa fa-plus" aria-hidden="true"></i></div>
                        </div>
                    </div>
                </div>
                <div className="artist">{this.props.song.artist}</div>
                <div className="album">{this.props.song.album}</div>
                <div className="year">{this.props.song.year}</div>
                <div className="duration">{formatSeconds(this.props.song.duration) }</div>
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
    collection: Playlist;
    selectorMap: any;
    default?: number;
    setter: any;
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
        let longest = this.props.selectorMap.reduce((pre, cur) => pre[1].length < cur[1].length ? cur : pre);
        return (
            <div className={this.props.className}>
                <div className="text">{this.props.text}</div>
                <div className="dropdownWrapper"><div className="spacer">{longest}</div>
                    <div className="helper">
                        <div className={"dropdown " + (this.state.visible ? "visible" : "") }
                            tabIndex="-1"
                            ref="dropdown"
                            onBlur={this.handleClick.bind(this, null) }
                            style={{ top: this.state.visible ? -0.5 * this.state.active + 'em' : 0 }}>
                            <ul>
                                {this.props.selectorMap.map((value) =>
                                    <DropDownEntry
                                        visible={this.state.visible ? true : false}
                                        active={value[0] == this.state.active ? true : false}
                                        text={value[1]}
                                        clicked={this.handleClick.bind(this, value[0]) }/>
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
            state.visible = false;
            this.setState(state);
        } else {
            if (state.visible) {
                state.visible = false;
                state.active = index;
                this.props.setter(index);
            } else {
                state.visible = true;
            }
        }
        this.setState(state);
    }
}

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
    volumeValue: number;
    volumeMute: boolean;
}

class PlayerIndicator extends React.Component<PlayerIndicatorProps, PlayerIndicatorState> {
    state = {
        current: 0,
        duration: 0,
        volumeState: false,
        volumeValue: 1.0,
        volumeMute: false,
    };

    componentDidMount() {
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
            if (findNextTrack != findRightmostLeaf) {
                this.props.playerControl(PlayerControl.next);
            } else {
                this.props.playerControl(PlayerControl.pause);
            }
        });

    }
    volumeControl(command: VolumeControl, value?: number) {
        switch (command) {
            case VolumeControl.toggle:
                console.log("Command:", "Toggle");
                if (this.state.volumeMute) {
                    this.state.volumeMute = false;
                    this.props.audioPlayer.volume = this.state.volumeValue;
                } else {
                    this.state.volumeMute = true;
                    this.props.audioPlayer.volume = 0;
                }
                break;
            case VolumeControl.set:
                console.log("Command:", "Set(" + value + ")");
                this.state.volumeMute = false;
                this.state.volumeValue = value;
                this.props.audioPlayer.volume = value;
                break;
            case VolumeControl.mute:
                console.log("Command:", "Mute");
                this.state.volumeMute = true;
                this.props.audioPlayer.volume = 0;
                break;
            case VolumeControl.unmute:
                console.log("Command:", "Unmute");
                this.state.volumeMute = false;
                this.props.audioPlayer.volume = this.state.volumeValue;
                break;
            case VolumeControl.getValue:
                return this.state.volumeValue;
            case VolumeControl.getMute:
                return this.state.volumeMute ? 1 : 0;
        }
    }

    toggleVolumeSlider() {
        console.log("VolumeSlider:", "toggle");
        let state = this.state;
        if (state.volumeState) {
            state.volumeState = false;
        } else {
            state.volumeState = true;
        }
        this.setState(state);
    }
    hideVolumeSlider() {
        console.log("VolumeSlider:", "hide");
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
            let node: Track = getTrack(this.props.queue, this.props.queueState);
            if (node != null) {
                title = node.title;
                artist = node.artist;
                art = getArt(this.props.queue, this.props.queueState);
            }
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
                        <div className="playStatus button" onClick={() => { this.props.playerControl(PlayerControl.toggle) } }><PlayIcon audioState={this.props.audioState}/></div>
                        <div className="next button" onClick={() => { this.props.playerControl(PlayerControl.next) } }><i className="fa fa-step-forward" aria-hidden="true"></i></div>
                        <div className="volume button" onClick={(event: any) => { this.toggleVolumeSlider() } }><VolumeIcon volumeControl={this.volumeControl.bind(this) } /></div>
                        <div className="repeat button"><i className="fa fa-repeat" aria-hidden="true"></i></div>
                        <div className="random button"><i className="fa fa-random" aria-hidden="true"></i></div>
                    </div>
                </div>
                {(this.state.volumeState) ? <VolumeSlider audioPlayer={this.props.audioPlayer} hide={this.hideVolumeSlider.bind(this) } volumeControl={this.volumeControl.bind(this) }/> : null}
            </div>
        )
    }
}

enum VolumeControl {
    toggle,
    set,
    unmute,
    mute,
    getValue,
    getMute,
}
function VolumeIcon(props: any) {
    if (props.volumeControl(VolumeControl.getMute) == 1) {
        return <i className="fa fa-volume-off fa-lg" aria-hidden="true" ></i>
    }
    if (props.volumeControl(VolumeControl.getValue) > 0.4) {
        return <i className="fa fa-volume-up fa-lg" aria-hidden="true" ></i>
    } else {
        return <i className="fa fa-volume-down fa-lg" aria-hidden="true" ></i>
    }
}
function PlayIcon(props: any) {
    switch (props.audioState) {
        case PlayStatus.play:
            return (<i className="fa fa-pause" aria-hidden="true"></i>);
        default:
            return (<i className="fa fa-play" aria-hidden="true"></i>);
    }
}
interface VolumeSliderProps {
    audioPlayer: HTMLAudioElement;
    volumeControl: any;
    hide: any;
}
class VolumeSlider extends React.Component<VolumeSliderProps, any> {

    componentDidMount() {
        //(ReactDOM.findDOMNode(this.refs["volumeSlider"]) as HTMLDivElement).focus();
    }

    render() {
        let volume = Math.floor(this.props.audioPlayer.volume * 100);
        return (
            <div className="volumeSliderWrapper">
                <div className="blurSpace" onClick={this.props.hide}></div>
                <div className="volumeSlider" tabIndex="-1" ref="volumeSlider">
                    <div onClick={() => this.props.volumeControl(VolumeControl.toggle) }>
                        <VolumeIcon volumeControl={this.props.volumeControl} />
                    </div>
                    <div className="volumeTrack">
                        <input type="range" className="slider" min="0" max="100" value={volume} onChange={(event: any) => (this.props.volumeControl(VolumeControl.set, event.target.value / 100)) }></input>
                    </div>
                </div >
            </div>
        );
    }
}

interface MenuEntryProps {
    title: string;
    view: ViewState;
    viewState: ViewState;
    viewControl: any;
}
function MenuEntry(props: MenuEntryProps) {
    let state = "inactive";
    if (props.viewState == props.view) {
        state = "active";
    }
    return (
        <div className={"menuEntry " + state} onClick={() => props.viewControl(props.view) } >
            <img className="entryArt" src="album.png" ></img>
            <div className="entryText">{props.title}</div>
        </div>
    );
}

function getLocalized(keyword: string) {
    let titleDict = {
        albums: "Alben",
        artists: "Künstler",
        songs: "Songs",
        playlists: "Wiedergabelisten",
        settings: "Einstellungen",
        queue: "Aktuelle Wiedergabe",
    };
    return (titleDict[keyword])
}

interface MenuPaneProps {
    collections: Collections;
    viewState: ViewState;
    viewControl: any;
}
class MenuPane extends React.Component<MenuPaneProps, any> {
    render() {
        let titleArray = ["albums", "songs", "queue"];
        return (
            <div className="menuPane">
                {titleArray.map((entry) =>
                    <MenuEntry
                        viewControl={this.props.viewControl}
                        viewState={this.props.viewState}
                        title={getLocalized(entry) }
                        view={ViewState[entry]}
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
    savedStates: {};
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
            viewState: ViewState.queue,
            queue: emptyQueue,
            queueState: [],
            savedStates: {},
        }
    }

    componentDidMount() {
        ipcRenderer.send('asynchronous-message', this.state.viewState)
        ipcRenderer.on('asynchronous-reply', (event, collections: string) => {
            let state = this.state;
            state.collections = JSON.parse(collections);
            this.setState(state);
        });
    }

    render() {
        return (
            <div className="windowRoot">
                <div className="windowLeftPane">
                    {<MenuPane
                        collections={this.state.collections}
                        viewState={this.state.viewState}
                        viewControl={this.viewControl.bind(this) }/>}
                </div>
                <div className="windowRightPane">
                    {(() => {
                        switch (this.state.viewState) {
                            case ViewState.albums:
                                return (<AlbumView
                                    playNode={this.playNode.bind(this) }
                                    addNode={this.addNode.bind(this) }
                                    collection={this.state.collections.albums}
                                    saveState={this.saveState.bind(this, "AlbumView") }
                                    loadState={this.loadState.bind(this, "AlbumView") }/>);
                            case ViewState.artists:
                                break;
                            case ViewState.songs:
                                return (<SongView
                                    playNode={this.playNode.bind(this) }
                                    addNode={this.addNode.bind(this) }
                                    collection={this.state.collections.songs}
                                    saveState={this.saveState.bind(this, "SongView") }
                                    loadState={this.loadState.bind(this, "SongView") }/>);
                            case ViewState.settings:
                                break;
                            case ViewState.queue:
                                return (<CurrentPlaylistEntry
                                    playNode={this.playNode.bind(this) }
                                    addNode={this.addNode.bind(this) }
                                    queue={this.state.queue}
                                    //queue={this.state.collections.albums}
                                    queueState={this.state.queueState}
                                    index={-1}/>);
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

    saveState(component: string, state: {}) {
        this.state.savedStates[component] = state;
    }
    loadState(component: string): {} {
        return this.state.savedStates[component];
    }

    playNode(item: PlaylistNode) {
        this.state.queue.items = [item];
        this.state.queueState = [];

        this.state.queueState = findLeftmostLeaf(this.state.queue);
        let track: Track = getTrack(this.state.queue, this.state.queueState);
        this.state.audioPlayer.src = track.uri;
        this.state.audioPlayer.play();
        this.state.audioState = PlayStatus.play;
        this.forceUpdate();
    }
    addNode(item: PlaylistNode) {
        let state = this.state;
        state.queue.items.push(item);
        this.setState(state);
    }

    togglePlay() {
        this.playerControl(PlayerControl.toggle);
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
                currentState = findNextTrack(this.state.queue, this.state.queueState);
                if (null == currentState) {
                    currentState = findLeftmostLeaf(this.state.queue)
                }
                break;
            case PlayerControl.previous:
                if (state.audioPlayer.currentTime < 4) {
                    currentState = findPreviousTrack(this.state.queue, this.state.queueState);
                    if (null == currentState) {
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
                if (!this.state.audioPlayer.src) {
                    currentState = findLeftmostLeaf(this.state.queue);
                    let track = getTrack(this.state.queue, currentState);
                    if (isTrack(track)) {
                        this.state.audioPlayer.src = track.uri;
                        this.state.audioPlayer.play();
                        this.state.audioState = PlayStatus.play;
                    }
                }
                if (this.state.audioPlayer.readyState) {
                    this.state.audioPlayer.play();
                    state.audioState = PlayStatus.play;
                }
                break;
            case PlayerControl.pause:
                this.state.audioPlayer.pause();
                state.audioState = PlayStatus.pause;
                break;
        }
        if (currentState != null) {
            state.queueState = currentState;
            track = getTrack(state.queue, state.queueState);
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









class CurrentPlaylistView extends React.Component<any, any> {
    render() {
        return (
            <div className="view queueView">
                {this.props.queue ? <CurrentPlaylistEntry playlist={this.props.queue} index={-1}/> : <EmptyList/>}
            </div>
        );
    }
}

class CurrentPlaylistEntry extends React.Component<any, any> {

    elementBuilder(nodes: PlaylistNode[], track: Track) {
        return nodes.reduce((flatArray, node, index) => {
            if (isTrack(node)) {
                let state = "inactive";
                if (track && node && node.title == track.title && node.artist == track.artist && node.album == track.album) {
                    state = "active";
                }
                let item = [<SongEntry active={state} playNode={this.props.playNode} addNode={this.props.addNode} song={node} id={"id" + index}/>];
                return flatArray.concat(item);
            }
            if (isPlaylist(node)) {
                let item = [];
                return flatArray.concat(
                    [<div className={"entry title"}><div className="text">{node.title}</div></div>],
                    this.elementBuilder(node.items, track)
                    ,[<div className={"entry end"}></div>]
                    );
            }
        }, []);
    }

    render() {
        return (
            <div className={"view queueView"}>
                <CurrentPlaylistHead />
                <CurrentPlaylistMenu />
                <div className={"viewList songs queue"}>
                    {this.elementBuilder(this.props.queue.items, getTrack(this.props.queue, this.props.queueState)) }
                </div>
            </div>
        );
    }
}

class CurrentPlaylistHead extends React.Component<any, any> {
    render() {
        return (
            <h1 className="viewTitel">{getLocalized("queue") }</h1>
        );
    }
}
class CurrentPlaylistMenu extends React.Component<any, any> {
    render() {
        return (
            <div className="viewMenu">
                <div>{"MenuEntry A"}</div>
                <div>{"MenuEntry B"}</div>
                <div>{"MenuEntry C"}</div>
                <div>{"MenuEntry D"}</div>
            </div>
        );
    }
}

class EmptyList extends React.Component<any, any> {
    render() {
        return (
            <div className="emptyList">{"Nothing to see here ..."}</div>
        );
    }
}