export enum PlaylistRole {
    collection,
    album,
    playlist,
    queue,
}

export interface PlaylistNode {
    type: "playlist"|"track"
}

export interface PlaylistItem {
}

export interface Playlist extends PlaylistNode {
    role: PlaylistRole;
    title: string;
    artist: string;
    art?: any;
    lastPlayed?: number;
    items: PlaylistNode[];
}

export interface Track extends PlaylistNode {
    title: string;
    artist: string;
    composer?: string;
    number?: number;
    art?: any;
    uri: string;
}

export interface Collections {
    albums: Playlist;
    artists: Playlist;
    songs: Playlist;
    playlists: Playlist;
}