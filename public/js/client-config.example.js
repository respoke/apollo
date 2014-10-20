var jira = require('./plugins/jira');
var emo = require('./plugins/emo');
var marked = require('./plugins/marked');
var renderFile = require('./plugins/render-file');


var clientConfig = {};

// clientConfig.jiraBaseWithSlash = 'https://jira.digium.com/browse/';

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

// An optional async function for rendering how files will display in the UI.
// The callback must implement the following:
//
//      function (fileObject, callback) { callback(err, fileDisplayHtml) }
// 
// If renderFile is omitted, it will not be used and uploaded files will not be rendered.
// 
clientConfig.renderFile = renderFile;

exports = module.exports = clientConfig;
