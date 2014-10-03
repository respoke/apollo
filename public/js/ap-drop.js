'use strict';
exports = module.exports = function () {
    return {
        link: function (scope, element, attrs) {
            
            var apDrop = attrs.apDrop ? scope.$eval(attrs.apDrop) : function (data) { };

            element[0].addEventListener('drop', function (evt) {
                element.removeClass('animated pulse infinite');
                
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files; // FileList object.

                for (var i=0; i < files.length; i++) {
                    var file = files[i];
                    var reader = new FileReader();
                    reader.onload = function () {
                        var contentType = reader.result.split(';')[0].replace('data:', '');
                        var content = reader.result.split('base64,')[1];
                        var data = {
                            dataURL: reader.result,
                            event: evt,
                            file: file,
                            name: file.name,
                            contentType: contentType,
                            content: content
                        };
                        apDrop(data);
                    };
                    reader.readAsDataURL(file);
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

    }
};
