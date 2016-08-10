import * as React from 'react';
import * as ReactDOM from 'react-dom';

var albumBox = React.createClass({
    //displayName: "albumBox",
    render: () => {
        return (
            <div className="albumBox">
                Hello,world! This is a albumBox.
            </div>
        );
    }
});

interface AlbumEntryProps {
    author: string;
}

class AlbumEntry extends React.Component<AlbumEntryProps, any> {
    constructor(props:AlbumEntryProps) {
        super(props);
    }
    render () {
        return (
            <div className="albumEntry">
                <h2 className="albumAuthor">
                    {this.props.author}
                </h2>
                {this.props.children}
            </div>
        );
    }
}

var AlbumList = React.createClass({
    //displayName: "albumList",
    render: () => {
        return(
            <div className="albumList">
                <AlbumEntry author="Foo Bar">Album 1</AlbumEntry>
                <AlbumEntry author="Spam Ham">Album 2</AlbumEntry>
            </div>
        );
    }
});

document.addEventListener('DOMContentLoaded', () => {
  let progress = document.getElementById('myBar');
  console.log("Master, I am ready!");
  ReactDOM.render(
    React.createElement(AlbumList),
    document.getElementById('container')
  );
});