/**
 * Default file renderer. Outputs some markdown and special symbol formats
 * for showing file icons (rendered by `emo`).
 * This can support async operations.
 * `callback(err, strFileTextOrHtml)`
 */
exports = module.exports = function (file, callback) {
    if (!file) {
        return callback();
    }

    var fileURL = '/files/' + file._id;
    var bytes = (4 * (file.content.length / 3)) * .6;
    var embed = '';
    var displayText = file.contentType;
    var iconSymbol = '';

    if (/audio/.test(file.contentType)) {
        iconSymbol = ':file-audio-o:';
        embed = '<br /><br /><audio src="' + fileURL + '" controls></audio>';
    }
    else if (/video/.test(file.contentType)) {
        iconSymbol = ':file-video-o:';
        embed = '<br /><br /><video src="' + fileURL + '" controls></video>';
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
        embed = '<br /><br /><img src="' + fileURL + '" />';
    }

    if (file.name) {
        displayText = file.name;
    }

    // render images directly.
    var messageText = '[' + displayText + ' - ' + (bytes/1024/1024).toFixed(3) + 'mb' 
            + '](/files/' + file._id + ')';

    messageText = iconSymbol + '&nbsp;' + messageText + embed;

    var err = null;
    callback(err, messageText);
};
