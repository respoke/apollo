'use strict';
/* global $ */
/**
 * Drag and drop multiple files for multi-file upload.
 */
exports = module.exports = ['multiFileProcessor', function (multiFileProcessor) {
    return {
        link: function (scope, element, attrs) {
            
            var apDrop = attrs.apDrop ? scope.$eval(attrs.apDrop) : function (data) { };

            element[0].addEventListener('drop', function (evt) {
                element.removeClass('animated pulse infinite');
                
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files; // FileList object.
                multiFileProcessor(files, apDrop);

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
}];
