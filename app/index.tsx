import * as React from 'react';
import * as ReactDOM from 'react-dom';

let mySound: HTMLAudioElement;


let mockupTracks: Track[] = [
    { artist: "Poets of the Fall", title: "Fire", number: 1, uri: "file:///D:/Musik/Poets%20of%20the%20Fall%20-%20Carnival%20of%20Rust%20[2006]/01%20-%20Fire.mp3" },
    { artist: "Poets of the Fall", title: "Sorry go'round", number: 1, uri: "file:///D:/Musik/Poets%20of%20the%20Fall%20-%20Carnival%20of%20Rust%20[2006]/02%20-%20Sorry%20go%20'round.mp3" }
]

let mockupAlbumData: Album[] = [
    { artist: "Bloodhound Gang", title: "Hooray For Boobies", art: "file:///D:/Musik/Bloodhound%20Gang%20-%20Hooray%20For%20Boobies/The_Bloodhound_Gang_-_Hooray_for_Boobies.png" },
    { artist: "Poets Of The Fall", title: "Carnival of Rust", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/carnivalofrust.jpg", tracks: mockupTracks },
    { artist: "DualCore", title: "AllTheThings", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/dualcore.jpg" },
    { artist: "DualCore", title: "NextLevel", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/nextlevel.jpg" },
    { artist: "Bloodhound Gang", title: "Hooray For Boobies", art: "file:///D:/Musik/Bloodhound%20Gang%20-%20Hooray%20For%20Boobies/The_Bloodhound_Gang_-_Hooray_for_Boobies.png" },
    { artist: "Poets Of The Fall", title: "Carnival of Rust", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/carnivalofrust.jpg" },
    { artist: "DualCore", title: "AllTheThings", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/dualcore.jpg" },
    { artist: "DualCore", title: "NextLevel", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/nextlevel.jpg" },
    { artist: "Bloodhound Gang", title: "Hooray For Boobies", art: "file:///D:/Musik/Bloodhound%20Gang%20-%20Hooray%20For%20Boobies/The_Bloodhound_Gang_-_Hooray_for_Boobies.png" },
    { artist: "Poets Of The Fall", title: "Carnival of Rust", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/carnivalofrust.jpg" },
    { artist: "DualCore", title: "AllTheThings", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/dualcore.jpg" },
    { artist: "DualCore", title: "NextLevel", art: "file:///C:/Users/denta/Documents/GitHub/mukake/app/nextlevel.jpg" }
]


let mockupPlaylist: Playlist = {
    position: 0,
    subposition: 0,
    items: []
}

function playAlbum (item:Album)  {
    mockupPlaylist.items = [{album: item}];
    mockupPlaylist.position = 0;
    mockupPlaylist.subposition = 0;
    mySound.src = mockupPlaylist.items[0].album.tracks[0].uri;
    mySound.play();
    console.log("addAlbumToCurrentPlaylist was called :)")
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

interface Track {
    artist?: string;
    title: string;
    number: number;
    uri: string;
}

interface Album {
    artist: string;
    art?: string;
    title: string;
    tracks?: Track[];
}

interface PlaylistItem {
    tracknumber?: number;
    album?: Album;
}

interface Playlist {
    position: number;
    subposition: number;
    items: PlaylistItem[];
}

interface AlbumEntryProps {
    album: Album;
}


class AlbumEntry extends React.Component<AlbumEntryProps, any> {
    constructor(props: AlbumEntryProps) {
        super(props);
    }
    render() {
        return (
            <div className="albumEntry">
                <div className="albumArtContainer">
                    <img src={this.props.album.art}></img>
                    <div className="albumControls">
                        <div className="albumControlsPlay" onClick={() => playAlbum(this.props.album)}><i className="fa fa-play" aria-hidden="true"></i></div>
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

function AlbumList(props) {
    return (
        <div className="albumList">
            {mockupAlbumData.map((element) =>
                <AlbumEntry album={element}></AlbumEntry>
            ) }
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

}

interface PlayerIndicatorState {
    currentTime: number;
    duration: number;
    album: Album;
    position: number;
    playstate: PlayStatus;

}

class PlayerIndicator extends React.Component<PlayerIndicatorProps,PlayerIndicatorState> {
    state = {
            currentTime: 0,
            duration: 0,
            album: undefined,
            position: 0,
            playstate: PlayStatus.stop,
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
            if ( Math.floor(mySound.currentTime) == state.currentTime) return;
            if ( isNaN(mySound.currentTime) ) return;
            state.currentTime = Math.floor(mySound.currentTime);
            console.log(state.currentTime);
            this.setState(state);
        };
        window.requestAnimationFrame(f);
        mySound.addEventListener("durationchange", (event: any) => {
            let state = this.state;
            state.duration = Math.floor(mySound.duration);
            this.setState(state);
        });
    }

    onPlayButton () {
        let state = this.state;
        switch (state.playstate) {
            case PlayStatus.stop:
            case PlayStatus.pause:
                mySound.play();
                state.playstate = PlayStatus.play;
                break;
            case PlayStatus.play:
                mySound.pause();
                state.playstate = PlayStatus.pause;
                break;
        }
        this.setState(state);
    }

    getPlayText () {
        switch(this.state.playstate) {
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
                <input type="range" className="slider" max={this.state.duration} value={this.state.currentTime} onChange={(event:any) => (mySound.currentTime = event.target.value)}></input>
                <div className="duration">{Math.floor(this.state.duration/60)}:{this.state.duration%60<10?"0"+this.state.duration%60:this.state.duration%60}</div>
                </div>
                <div className="controls">
                <div className="previous button"><i className="fa fa-step-backward" aria-hidden="true"></i></div>
                <div className="playStatus button" onClick={() => {this.onPlayButton()}}>{this.getPlayText()}</div>
                <div className="next button"><i className="fa fa-step-forward" aria-hidden="true"></i></div>
                <div className="volume button"><i className="fa fa-volume-up" aria-hidden="true"></i></div>
                <div className="repeat button"><i className="fa fa-repeat" aria-hidden="true"></i></div>
                <div className="random button"><i className="fa fa-random" aria-hidden="true"></i></div>
                </div>
            </div>
        )
    }
}

let myPlayerIndicator = <PlayerIndicator />;
let starttime = (new Date).getTime();

document.addEventListener('DOMContentLoaded', () => {
    let progress = document.getElementById('myBar');
    console.log("Master, I am ready!");
    mySound = new Audio();
    mySound.volume = 0.0;
    /*
    mySound.addEventListener("timeupdate", (event: any) => {
            console.log(event.timeStamp/1000);
            console.log(((new Date).getTime() - starttime)/1000);
        });
    */
    ReactDOM.render(
        <div>
            <AlbumList />
            {myPlayerIndicator}
        </div>,
        document.getElementById('container')
    );
});

