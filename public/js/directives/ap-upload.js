'use strict';
/* global $ */

/**
 * Add the ap-upload="callback(fileDataArray)" to a button, and it will
 * act as a file upload button.
 */
exports = module.exports = ['multiFileProcessor', function (multiFileProcessor) {
    return {
        link: function (scope, element, attrs) {
            
            var apUpload = attrs.apUpload ? scope.$eval(attrs.apUpload) : function (data) { };
            
            var uploadInput = document.createElement('input');
            uploadInput.setAttribute('type', 'file');
            uploadInput.setAttribute('multiple', 'multiple');
            uploadInput.style.display = 'none';
            uploadInput.addEventListener('change', function (evt) {
                var files = uploadInput.files;
                if (!files || !files.length) {
                    return;
                }
                multiFileProcessor(files, apUpload);
            });

            element[0].addEventListener('click', function (evt) {
                $(uploadInput).click();
                evt.stopPropagation();
                evt.preventDefault();

            }, false);

        }
    };
}];
