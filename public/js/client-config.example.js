var emo = require('./lib/emo');
var marked = require('./lib/marked');
var renderFile = require('./lib/render-file');


var clientConfig = {};

// When rendering a message, you can pass it through async middleware.
// Middleware should accept two arguments, a string of content, and the function `next`.
//
//      function (messageContent, next) {  }
//
// If the function `next(err)` returns an error, the middleware execution stops and the 
// error is displayed instead of the message.
clientConfig.messageRenderingMiddleware = [emo, marked];

// An async function for rendering how files will display in the UI.
// The callback must implement the following arguments: `(err, fileDisplayHtml)`
//
//      function (fileObject, callback) {  }
// 
clientConfig.renderFile = renderFile;

exports = module.exports = clientConfig;
