import * as fs from 'fs';
import * as path from 'path';
import * as musicmetadata from 'musicmetadata';
import {PlaylistItem, PlaylistNode, PlaylistRole, Playlist, Track} from './app/types';


process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});

export function recursiveReaddirSync(dir) {

    let list = [];
    const files = fs.readdirSync(dir);
    
    files.forEach(function (file) {

        const stats = fs.lstatSync(path.join(dir, file));

        if(stats.isDirectory()) {
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

function musicmetadatawrapper(filename:string):Promise<any> {
    return new Promise((resolve,reject) => {
        musicmetadata(fs.createReadStream(filename), (error, metadata) => {
            if (error) {
                reject(error);
                return;
            }
            metadata.filename = filename;
            console.log(metadata);
            resolve(metadata);
        });
    });
}

export function buildLibrary(filelist) {
    return Promise.resolve().then(() => {
        let library:Playlist = {type: "playlist", role: PlaylistRole.collection, title: "Albums", artist: "Internal", items: []}
        let albumByName = {}
        //filelist = [filelist[0]];
        let promises = filelist.map(e => musicmetadatawrapper(path.resolve(e)).catch((error) => null));
        return Promise.all(promises).then((e:any) => {
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
                    album = {type: "playlist", role: PlaylistRole.album, artist: artist[0], title: metadata.album, art:metadata.picture[0], items: []};
                    library.items.push(album);
                    albumByName[album.title] = album;
                }
                let track:Track = {type: "track", artist:metadata.artist, title:metadata.title, number:metadata.track.no, uri:metadata.filename};
                album.items.push(track);
            }
            return {albums: library, artists: null, songs: null, playlists: null};
        });
    });
}