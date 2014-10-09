'use strict';
exports = module.exports = ['$rootScope', '$log', function ($rootScope, $log) {
    var service = {};

    service.audioSourceId = localStorage.getItem('audioSourceId');
    service.videoSourceId = localStorage.getItem('videoSourceId');

    service.audioSources = [];
    service.videoSources = [];

    if (MediaStreamTrack && MediaStreamTrack.getSources) {
        MediaStreamTrack.getSources(function (sources) {
            if (!sources || !sources.length) {
                $log.debug('No media sources.');
                return;
            }
            sources.forEach(function (source) {
                if (source.kind === 'video') {
                    $log.debug('video source', source);
                    service.videoSources.push(source);
                }
                else if (source.kind === 'audio') {
                    $log.debug('audio source', source);
                    service.audioSources.push(source);
                }
                else {
                    $log.debug('unknown media source kind', source);
                }
            });

        });
    }
    else {
        $log.debug('no MediaStreamTrack.getSources');
    }

    $rootScope.$watch(function () {
        return service.audioSourceId;
    }, function (newValue, oldValue) {
        localStorage.setItem('audioSourceId', newValue);
        $log.debug('set audio source', newValue);
    });
    $rootScope.$watch(function () {
        return service.videoSourceId;
    }, function (newValue, oldValue) {
        localStorage.setItem('videoSourceId', newValue);
        $log.debug('set video source', newValue);
    });

    return service;
}];
