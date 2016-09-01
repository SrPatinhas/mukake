import * as fs from 'fs';
import * as path from 'path';
import * as musicmetadata from 'musicmetadata';
import {PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from './types';


process.on('unhandledRejection', function (reason, p) {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});

export function recursiveReaddirSync(dir) {

    let list = [];
    const files = fs.readdirSync(dir);

    files.forEach(function (file) {

        const stats = fs.lstatSync(path.join(dir, file));

        if (stats.isDirectory()) {
            list = list.concat(recursiveReaddirSync(path.join(dir, file)));
        } else {
            list.push(path.join(dir, file));
        }
    });
    return list;
}
/*
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
*/

function musicmetadatawrapper(filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
        musicmetadata(fs.createReadStream(filename), { duration: true }, (error, metadata) => {
            if (error) {
                reject(error);
                return;
            }
            metadata.filename = filename;
            //console.log(metadata);
            resolve(metadata);
        });
    });
}

export function buildLibrary(fileList) {

    let songsLibrary: Playlist = { type: "playlist", role: PlaylistRole.collection, title: "Songs", artist: "Internal", items: [] }
    let artistsLibrary: Playlist = { type: "playlist", role: PlaylistRole.collection, title: "Artists", artist: "Internal", items: [] }
    let albumsLibrary: Playlist = { type: "playlist", role: PlaylistRole.collection, title: "Albums", artist: "Internal", items: [] }
    let playlistsLibrary: Playlist = { type: "playlist", role: PlaylistRole.collection, title: "Playlists", artist: "Internal", items: [] }
    //let songsByName = {};
    let artistsByName = {};
    let albumsByName = {};
    let playlistsByName = {};
    let titleCounter = 0;

    function sortMetadata(data: any) {
        console.log(data.picture);
        for (let metadata of data) {
            if (!metadata) {
                continue;
            }
            let thisAlbum: { album: Playlist; hasPicture: boolean; hasArtist: boolean };
            let thisArtist: { artist: Playlist; };
            let picture: any = null;
            let title: string = "Unknown Title" + ("0000" + titleCounter).slice(-4);
            let album: string = "Unknown Album";
            let artist: string[] = ["Unknown Artist"];
            let albumArtist: string[] = ["Unknown Artist"];
            let hasPicture: boolean = false;
            let hasArtist: boolean = false;

            if (metadata.title) {
                title = metadata.title;
                console.log("Title:", title);
            }
            if (metadata.album) {
                album = metadata.album;
                console.log("Album:", album);
            }
            if (metadata.artist) {
                artist = metadata.artist;
                albumArtist = artist;
                console.log("Artist:", artist);
            }
            if ((metadata.albumartist as string[]).length) {
                albumArtist = metadata.albumartist;
                hasArtist = true;
                console.log("AlbumArtist:", albumArtist);
            }
            if (metadata.picture.length > 0) {
                picture = metadata.picture[0];
                picture.data = new Buffer(picture.data, 'binary').toString('base64');//btoa(String.fromCharCode.apply(null, picture.data));
                hasPicture = true;
                console.log("Found Art");
            }

            let track: Track = { 
                type: "track", 
                artist: artist[0], 
                title: title, 
                album: album,
                duration: metadata.duration,
                year: metadata.year,
                number: metadata.track.no, 
                uri: metadata.filename };
            songsLibrary.items.push(track);

            if (album in albumsByName) {
                thisAlbum = albumsByName[album];
                thisAlbum.album.items.push(track);
                if (!thisAlbum.hasPicture && hasPicture) {
                    thisAlbum.album.art = picture;
                }
                if (!thisAlbum.hasArtist && hasArtist) {
                    thisAlbum.album.artist = albumArtist[0];
                }
            }
            else {
                let artist: string[];
                let thisAlbum: { album: Playlist, hasPicture: boolean, hasArtist: boolean } = {
                    album: {
                        type: "playlist",
                        role: PlaylistRole.album,
                        artist: albumArtist[0],
                        title: album,
                        art: picture,
                        items: []
                    },
                    hasPicture: hasPicture,
                    hasArtist: hasArtist
                };

                albumsLibrary.items.push(thisAlbum.album);
                albumsByName[thisAlbum.album.title] = thisAlbum
            }

            if (artist) {
                for (let entry of artist) {
                    if (entry in artistsByName) {
                        thisArtist = artistsByName[entry];
                        thisArtist.artist.items.push(track);
                    }
                    else {
                        let thisArtist: { artist: Playlist } = {
                            artist: {
                                type: "playlist",
                                role: PlaylistRole.album,
                                artist: entry,
                                title: entry,
                                art: null,
                                items: [],
                            },
                        };
                        artistsLibrary.items.push(thisArtist.artist);
                        artistsByName[thisArtist.artist.artist] = thisArtist;

                    }
                }
            }
    }
    let foo = JSON.stringify(songsLibrary);
    let foo2 = JSON.parse(foo);
    console.log("Songs:", foo2);
    return { albums: albumsLibrary, artists: artistsLibrary, songs: songsLibrary, playlists: playlistsLibrary };
}

function resolve() {
    let promises = fileList.map(file => musicmetadatawrapper(path.resolve(file)).catch((error) => { console.log("Could not resolve: ", file); return null }));
    return Promise.all(promises).then(sortMetadata)
}
return Promise.resolve().then(resolve);
}

export function buildLibrary2(filelist) {
    return Promise.resolve().then(() => {
        let library: Playlist = { type: "playlist", role: PlaylistRole.collection, title: "Albums", artist: "Internal", items: [] }
        let albumByName = {}
        //filelist = [filelist[0]];
        let promises = filelist.map(e => musicmetadatawrapper(path.resolve(e)).catch((error) => null));
        return Promise.all(promises).then((e: any) => {
            for (let metadata of e) {
                if (!metadata) {
                    continue;
                }
                let album: Playlist;
                let artist: string[] = ["Unknown Artist"];
                if (metadata.artist) {
                    artist = metadata.artist;
                }
                if (metadata.albumartist) {
                    artist = metadata.albumartist;
                }
                if (metadata.album in albumByName) {
                    album = albumByName[metadata.album];
                } else {
                    album = { type: "playlist", role: PlaylistRole.album, artist: artist[0], title: metadata.album, art: metadata.picture[0], items: [] };
                    library.items.push(album);
                    albumByName[album.title] = album;
                }
                let track: Track = { type: "track", artist: metadata.artist, title: metadata.title, number: metadata.track.no, uri: metadata.filename, year: 0, duration: 0, album: metadata.album };
                album.items.push(track);
            }
            return { albums: library, artists: null, songs: null, playlists: null };
        });
    });
}