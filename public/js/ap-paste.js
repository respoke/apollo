'use strict';
exports = module.exports = function () {
    return {
        link: function (scope, element, attrs) {
            
            var apPaste = attrs.apPaste ? scope.$eval(attrs.apPaste) : function (data) { };

            element.bind('paste', onPasteEvent);

            function onPasteEvent(event) {
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
            }

        }

    }
};
