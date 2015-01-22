/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
/**
 * Default file renderer. Outputs some markdown and special symbol formats
 * for showing file icons (rendered by `emo`).
 *
 * This can support async operations.
 *
 * @params object file - the file record from Apollo's database
 * @params function next - `next(err, strFileTextOrHtml)`
 */
exports = module.exports = function renderFile(file, next) {
    if (!file) {
        return next();
    }

    var fileURL = '/files/' + file._id;
    // the approx diff ratio between base64 string and binary file
    var bytes = (4 * (file.content.length / 3)) * 0.6;
    var embed = '';
    var displayText = file.contentType;
    var iconSymbol = '';

    if (/audio/.test(file.contentType)) {
        iconSymbol = ':file-audio-o:';
        embed = '<br /><br /><audio src="' + fileURL + '" controls loop></audio>';
    }
    else if (/video/.test(file.contentType)) {
        iconSymbol = ':file-video-o:';
        embed = '<br /><br /><video src="' + fileURL + '" controls loop></video>';
    }
    else if (/zip|gz|tar/.test(file.contentType)) {
        iconSymbol = ':file-archive-o:';
    }
    else if (/html|javascript|css|json/.test(file.contentType)) {
        iconSymbol = ':file-code-o:';
    }
    else if (/pdf/.test(file.contentType)) {
        iconSymbol = ':file-pdf-o:';
    }
    else if (/text/.test(file.contentType)) {
        iconSymbol = ':file-text-o:';
    }
    else if (/image/.test(file.contentType)) {
        iconSymbol = ':file-image-o:';
        embed = '<br /><br /><a href="' + fileURL + '" target="_blank"><img src="' + fileURL + '" /></a>';
    }

    if (file.name) {
        displayText = file.name;
    }

    // render images directly.
    var messageText = '[' + iconSymbol + '&nbsp;&nbsp;'
        + displayText + ' - ' + (bytes/1024/1024).toFixed(3) + 'mb'
        + '](/files/' + file._id + ')'
        + embed;

    var err = null;
    next(err, messageText);
};
