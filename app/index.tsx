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

function playAlbum (item)  {
    mockupPlaylist.items = [item];
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
    playstate?: PlayStatus;
}

class PlayerIndicator extends React.Component<PlayerIndicatorProps,any> {
    render () {
        return (
            <div className="playerIndicator">
                <div className="track">
                    <div className="art">
                        <img src="http://placehold.it/300x300"></img>
                    </div>
                    <div className="info">
                        <div className="track">What's up?</div>
                        <div className="artist">Four Non Blondes</div>
                    </div>
                </div>
                <div className="progress">
                <div className="currentTime">0:00</div>
                <input type="range"></input>
                <div className="duration">0:00</div>
                </div>
                <div className="controls">
                <div className="previous">Prev</div>
                <div className="playStatus">Play</div>
                <div className="next">Next</div>
                </div>
            </div>
        )
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let progress = document.getElementById('myBar');
    console.log("Master, I am ready!");
    ReactDOM.render(
        <div>
            <AlbumList />
            <PlayerIndicator />
        </div>,
        document.getElementById('container')
    );
    mySound = new Audio();
    mySound.volume = 1.0;
});

