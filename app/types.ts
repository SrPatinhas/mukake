export enum PlaylistRole {
    collection,
    album,
    playlist,
    queue,
}

export interface PlaylistNode {
    type: "playlist"|"track";
    title: string;
    artist: string;
    art?: any;
}

export interface PlaylistItem {
}

export interface Playlist extends PlaylistNode {
    role: PlaylistRole;
    lastPlayed?: number;
    items: PlaylistNode[];
}

export interface Track extends PlaylistNode {
    composer?: string;
    number?: number;
    uri: string;
}

export interface Collections {
    albums: Playlist;
    artists: Playlist;
    songs: Playlist;
    playlists: Playlist;
}