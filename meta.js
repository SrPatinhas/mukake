"use strict";
var fs = require('fs');
var path = require('path');
var musicmetadata = require('musicmetadata');
process.on('unhandledRejection', function (reason, p) {
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
    var list = [];
    var files = fs.readdirSync(dir);
    files.forEach(function (file) {
        var stats = fs.lstatSync(path.join(dir, file));
        if (stats.isDirectory()) {
            list = list.concat(recursiveReaddirSync(path.join(dir, file)));
        }
        else {
            list.push(path.join(dir, file));
        }
    });
    return list;
}
exports.recursiveReaddirSync = recursiveReaddirSync;
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
function musicmetadatawrapper(filename) {
    return new Promise(function (resolve, reject) {
        console.log("Promise was called.", filename);
        musicmetadata(fs.createReadStream(filename), function (error, metadata) {
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
    return Promise.resolve().then(function () {
        var library = [];
        var albumByName = {};
        //filelist = [filelist[0]];
        var promises = filelist.map(function (e) { return musicmetadatawrapper(path.resolve(e)).catch(function (error) { return null; }); });
        return Promise.all(promises).then(function (e) {
            for (var _i = 0, e_1 = e; _i < e_1.length; _i++) {
                var metadata = e_1[_i];
                if (!metadata) {
                    continue;
                }
                var album = void 0;
                if (metadata.album in albumByName) {
                    album = albumByName[metadata.album];
                }
                else {
                    album = { artist: metadata.artist, title: metadata.album, art: metadata.picture[0], tracks: [] };
                    library.push(album);
                    albumByName[album.title] = album;
                }
                var track = { artist: metadata.artist, title: metadata.title, number: metadata.track.no, uri: metadata.filename };
                album.tracks.push(track);
            }
            return library;
        });
    });
}
exports.buildLibrary = buildLibrary;
