export enum ViewState {
    albums,
    artists,
    songs,
    playlists,
    settings,
    queue,
}

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
    year?: number;
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
    duration: number;
    album: string;
    year: number;
}

export interface Collections {
    albums: Playlist;
    artists: Playlist;
    songs: Playlist;
    playlists: Playlist;
}