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
exports = module.exports = function () {
    return {
        link: function (scope, element, attrs) {

            var apPaste = attrs.apPaste ? scope.$eval(attrs.apPaste) : function (data) { };
            var onPasteEvent = function (event) {
                var clipboardData = event.clipboardData || event.originalEvent.clipboardData;
                var found = false;

                if (!clipboardData || !clipboardData.types || !clipboardData.types.length) {
                    return;
                }
                clipboardData.types.forEach(function (type, i) {
                    if (found) {
                      return;
                    }
                    if (!type) {
                        found = true;
                        return;
                    }

                    var file = clipboardData.items[i].getAsFile();
                    if (!file) {
                        return; // not a file blob, just text
                    }
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        var contentType = evt.target.result.split(';')[0].replace('data:', '');
                        var content = evt.target.result.split('base64,')[1];
                        var data = {
                            dataURL: evt.target.result,
                            event: evt,
                            file: file,
                            name: file.name,
                            contentType: contentType,
                            content: content
                        };
                        apPaste(data);
                    };
                    reader.readAsDataURL(file);
                    found = true;
                });
            };
            element.bind('paste', onPasteEvent);

        }

    };
};
