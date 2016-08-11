import * as fs from 'fs';
import * as path from 'path';
import * as musicmetadata from 'musicmetadata';

process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});

/*
musicmetadata(fs.createReadStream("../library/"), (error, metadata) => {
            if (error) {
                console.log(error);
                return;
            }
            console.log(metadata);
        });
*/
function recursiveReaddirSync(dir) {

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
        console.log("Promise was called.", filename)
        musicmetadata(fs.createReadStream(filename), (error, metadata) => {
            if (error) {
                reject(error);
                return;
            }
            metadata.filename = filename;
            resolve(metadata);
        });
    });
}

function buildLibrary(filelist) {
    return Promise.resolve().then(() => {
        let library = [];
        let albumByName = {}
        //filelist = [filelist[0]];
        let promises = filelist.map(e => musicmetadatawrapper(e).catch((error) => null));
        return Promise.all(promises).then((e:any) => {
            for (let metadata of e {
                if (!metadata) {
                    continue;
                }
                let album;
                if (metadata.album in albumByName) {
                    album = albumByName[metadata.album];
                } else {
                    album = {artist: metadata.album, title: metadata.album, art:metadata.picture[0], tracks: []};
                    library.push(album)
                    albumByName[album.title] = album;
                }
                let track = {artist:metadata.artist, title:metadata.title, number:metadata.track.no, uri:metadata.filename};
                album.tracks.push(track);
            }
            return library;
        });
    });
}

buildLibrary(recursiveReaddirSync("library")).then(console.log)

