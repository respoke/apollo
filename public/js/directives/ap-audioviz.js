'use strict';
/**
 * A directive for visualizing audio volume from streams.
 * Usage:
 *
 *      <img ap-avatar email="billy@respoke.io" />
 *
 */
exports = module.exports = function () {
    // keep from making a bunch of audio contexts. only need one.
    var audioContext = new webkitAudioContext();
    var analyzer = scope.audioContext.createAnalyser();

    return {
        restrict: 'E',
        scope: {
            'stream1': '=stream1',
            'stream2': '=stream2'
        },
        link: function (scope, element, attrs) {

            var barHeight = 65;
            var barWidth = 50;

            scope.audioContext = audioContext;

            scope.analyser = analyzer;
            scope.analyser.smoothingTimeConstant = 0.8;
            scope.analyser.fftSize = 1024;

            scope.processor = scope.audioContext.createScriptProcessor(2048, 2, 1);

            scope.processor.connect(scope.audioContext.destination);
            scope.analyser.connect(scope.processor);

            scope.cvs = document.createElement("canvas");
            scope.canvasContext = scope.cvs.getContext("2d");

            function processAudio() {

                if (scope.stream1) {
                    scope.input1 = scope.audioContext.createMediaStreamSource(scope.stream1);
                    scope.input1.connect(scope.analyser);
                }
                if (scope.stream2) {
                    scope.input2 = scope.audioContext.createMediaStreamSource(scope.stream2);
                    scope.input2.connect(scope.analyser);
                }

                scope.processor.onaudioprocess = function () {
                    var array =  new Uint8Array(scope.analyser.frequencyBinCount);
                    scope.analyser.getByteFrequencyData(array);
                    var values = 0;

                    var length = array.length;
                    for (var i = 0; i < length; i++) {
                        values += array[i];
                    }
                    var average = values / length;
                    scope.canvasContext.clearRect(0, 0, barWidth, barHeight);
                    scope.canvasContext.fillStyle = '#ffffff';

                    var showHeight = average;
                    scope.canvasContext.fillRect(0, showHeight, barWidth, barHeight);
                };

                element[0].innerHTML = '';
                element[0].appendChild(scope.cvs);
            }

            scope.$watch('stream1', processAudio);
            scope.$watch('stream2', processAudio);
        }
    };
};
