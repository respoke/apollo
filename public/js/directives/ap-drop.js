'use strict';
/* global $ */
/**
 * Drag and drop multiple files for multi-file upload
 */
exports = module.exports = function () {
    return {
        link: function (scope, element, attrs) {
            
            var apDrop = attrs.apDrop ? scope.$eval(attrs.apDrop) : function (data) { };

            element[0].addEventListener('drop', function (evt) {
                element.removeClass('animated pulse infinite');
                
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files; // FileList object.
                var data = []; // array of file data
                var digestFile = function (file) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        var contentType = reader.result.split(';')[0].replace('data:', '');
                        var content = reader.result.split('base64,')[1];
                        var d = {
                            dataURL: reader.result,
                            event: evt,
                            file: file,
                            name: file.name,
                            contentType: contentType,
                            content: content
                        };
                        data.push(d);
                        if (data.length === files.length) {
                            apDrop(data);
                        } 
                    };
                    reader.readAsDataURL(file);
                };

                for (var i=0; i < files.length; i++) {
                    var file = files[i];
                    digestFile(file);
                }

            }, false);

            element[0].addEventListener('dragover', function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }, false);

            element.on('dragenter', function () {
                $(this).addClass('animated pulse infinite');
            });

            element.on('dragleave', function () {
                $(this).removeClass('animated pulse infinite');
            });

        }

    };
};
