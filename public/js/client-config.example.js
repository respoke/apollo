// Require any plugins here
var emo = require('./parsers/emo');
var marked = require('./parsers/marked');
var jira = require('./parsers/jira');
var renderFile = require('./parsers/render-file');

var clientConfig = {};

// clientConfig.jiraBaseWithSlash = 'https://your.base.jira.url/';

// When rendering a message, you can pass it through async middleware.
// Middleware should accept two arguments, a string of content, and the function `next`.
//
//      function (messageContent, next) {  }
//
// If the function `next(err)` returns an error, the middleware execution stops and the
// error is displayed instead of the message.
clientConfig.messageRenderingMiddleware = [
    // jira(clientConfig.jiraBaseWithSlash),
    emo,
    marked
];

/**
 * Which emo macros should be available?
 * http://fortawesome.github.io/Font-Awesome/icons
 */
clientConfig.emoMacros = [
    {display: '<i class="fa fa-smile-o"></i>',      name: 'smile', _id: ':smile-o:'},
    {display: '<i class="fa fa-frown-o"></i>',      name: 'frown', _id: ':frown-o:'},
    {display: '<i class="fa fa-meh-o"></i>',        name: 'meh', _id: ':meh-o:'},
    {display: '<i class="fa fa-heart"></i>',        name: 'heart', _id: ':heart:'},
    {display: '<i class="fa fa-thumbs-up"></i>',    name: 'thumbs up', _id: ':thumbs-up:'},
    {display: '<i class="fa fa-thumbs-down"></i>',  name: 'thumbs down', _id: ':thumbs-down:'},
    {display: '<i class="fa fa-child"></i>',        name: 'child success', _id: ':child:'},
    {display: '<i class="fa fa-arrow-up"></i>',     name: 'arrow up', _id: ':arrow-up:'},
    {display: '<i class="fa fa-arrow-down"></i>',   name: 'arrow down', _id: ':arrow-down:'},
    {display: '<i class="fa fa-arrow-left"></i>',   name: 'arrow left', _id: ':arrow-left:'},
    {display: '<i class="fa fa-arrow-right"></i>',  name: 'arrow right', _id: ':arrow-right:'},
    {display: '<i class="fa fa-star"></i>',         name: 'star full', _id: ':star:'},
    {display: '<i class="fa fa-star-half-o"></i>',  name: 'star half', _id: ':star-half-o:'},
    {display: '<i class="fa fa-star-o"></i>',       name: 'star empty', _id: ':star-o:'},
    {display: '<i class="fa fa-fire"></i>',         name: 'fire', _id: ':fire:'},
    {display: '<i class="fa fa-magic"></i>',        name: 'magic', _id: ':magic:'},
    {display: '<i class="fa fa-rocket"></i>',       name: 'rocket', _id: ':rocket:'},
    {display: '<i class="fa fa-space-shuttle"></i>',name: 'space shuttle', _id: ':space-shuttle:'},
    {display: '<i class="fa fa-check"></i>',        name: 'check ok', _id: ':check:'},
    {display: '<i class="fa fa-male"></i>',         name: 'male', _id: ':male:'},
    {display: '<i class="fa fa-female"></i>',       name: 'female', _id: ':female:'},
    {display: '<i class="fa fa-bolt"></i>',         name: 'lightning bolt', _id: ':bolt:'},
    {display: '<i class="fa fa-coffee"></i>',       name: 'coffee', _id: ':coffee:'},
    {display: '<i class="fa fa-beer"></i>',         name: 'beer', _id: ':beer:'}
];

// An optional async function for rendering how files will display in the UI.
// The callback must implement the following:
//
//      function (fileObject, callback) { callback(err, fileDisplayHtml) }
//
// If renderFile is omitted, it will not be used and uploaded files will not be rendered.
//
clientConfig.renderFile = renderFile;

exports = module.exports = clientConfig;
