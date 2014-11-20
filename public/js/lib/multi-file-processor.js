/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The GPL v2 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
'use strict';
/**
 * Take multiple file objects which were dragged or selected in an upload dialog,
 * and return them as base64 encoded strings.
 */
exports = module.exports = function () {
        return function (files, callback) {

        var data = []; // array of file data

        var digestFile = function (file) {
            var reader = new FileReader();
            reader.onload = function () {
                var contentType = reader.result.split(';')[0].replace('data:', '');
                var content = reader.result.split('base64,')[1];
                var d = {
                    dataURL: reader.result,
                    file: file,
                    name: file.name,
                    contentType: contentType,
                    content: content
                };
                data.push(d);
                if (data.length === files.length) {
                    callback(data);
                }
            };
            reader.readAsDataURL(file);
        };

        for (var i=0; i < files.length; i++) {
            var file = files[i];
            digestFile(file);
        }
    };
};
