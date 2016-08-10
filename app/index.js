"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var ReactDOM = require('react-dom');
var albumBox = React.createClass({
    //displayName: "albumBox",
    render: function () {
        return (React.createElement("div", {className: "albumBox"}, "Hello,world! This is a albumBox."));
    }
});
var AlbumEntry = (function (_super) {
    __extends(AlbumEntry, _super);
    function AlbumEntry(props) {
        _super.call(this, props);
    }
    AlbumEntry.prototype.render = function () {
        return (React.createElement("div", {className: "albumEntry"}, React.createElement("h2", {className: "albumAuthor"}, this.props.author), this.props.children));
    };
    return AlbumEntry;
}(React.Component));
var AlbumList = React.createClass({
    //displayName: "albumList",
    render: function () {
        return (React.createElement("div", {className: "albumList"}, React.createElement(AlbumEntry, {author: "Foo Bar"}, "Album 1"), React.createElement(AlbumEntry, {author: "Spam Ham"}, "Album 2")));
    }
});
document.addEventListener('DOMContentLoaded', function () {
    var progress = document.getElementById('myBar');
    console.log("Master, I am ready!");
    ReactDOM.render(React.createElement(AlbumList), document.getElementById('container'));
});
