'use strict';
/**
 * Setting respoke video
 */
exports = module.exports = [
    '$window',
    function ($window) {
        var doc = $window.document;
        return {
            setLocalVideo: function (stream) {
                // since it reuses the element, you must call play 
                // in case the call stops and then restarts.
                var localVideoParent = doc.getElementById('respokeLocalVideo');
                localVideoParent.innerHTML = "";
                var videoElement = doc.createElement('video');
                videoElement.src = $window.URL.createObjectURL(stream);
                videoElement.play();
                localVideoParent.appendChild(videoElement);
            },
            setRemoteVideo: function (stream) {
                var remoteVideoParent = doc.getElementById('respokeRemoteVideo');
                remoteVideoParent.innerHTML = "";
                var videoElement = doc.createElement('video');
                videoElement.src = $window.URL.createObjectURL(stream);
                videoElement.play();
                remoteVideoParent.appendChild(videoElement);
            },
            cleanup: function () {
                var localVideoParent = doc.getElementById('respokeLocalVideo');
                var remoteVideoParent = doc.getElementById('respokeRemoteVideo');
                localVideoParent.innerHTML = "";
                remoteVideoParent.innerHTML = "";
            }
        };
    }
];
