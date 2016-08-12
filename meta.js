"use strict";
var fs = require('fs');
var path = require('path');
var musicmetadata = require('musicmetadata');
var types_1 = require('./app/types');
process.on('unhandledRejection', function (reason, p) {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});
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
        musicmetadata(fs.createReadStream(filename), function (error, metadata) {
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
function buildLibrary(filelist) {
    return Promise.resolve().then(function () {
        var library = { type: "playlist", role: types_1.PlaylistRole.collection, title: "Albums", artist: "Internal", items: [] };
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
                var artist = ["Unknown Artist"];
                if (metadata.artist) {
                    artist = metadata.artist;
                }
                if (metadata.albumartist) {
                    artist = metadata.albumartist;
                }
                if (metadata.album in albumByName) {
                    album = albumByName[metadata.album];
                }
                else {
                    album = { type: "playlist", role: types_1.PlaylistRole.album, artist: artist[0], title: metadata.album, art: metadata.picture[0], items: [] };
                    library.items.push(album);
                    albumByName[album.title] = album;
                }
                var track = { type: "track", artist: metadata.artist, title: metadata.title, number: metadata.track.no, uri: metadata.filename };
                album.items.push(track);
            }
            return library;
        });
    });
}
exports.buildLibrary = buildLibrary;
