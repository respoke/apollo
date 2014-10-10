'use strict';
/**
 * Setting respoke video
 */
exports = module.exports = [
    function () {
        
        return {
            setLocalVideo: function (stream) {
                // since it reuses the element, you must call play 
                // in case the call stops and then restarts.
                var localVideoParent = document.getElementById('respokeLocalVideo');
                localVideoParent.innerHTML = "";
                var videoElement = document.createElement('video');
                videoElement.src = window.URL.createObjectURL(stream);
                videoElement.play();
                localVideoParent.appendChild(videoElement);
            },
            setRemoteVideo: function (stream) {
                var remoteVideoParent = document.getElementById('respokeRemoteVideo');
                remoteVideoParent.innerHTML = "";
                var videoElement = document.createElement('video');
                videoElement.src = window.URL.createObjectURL(stream);
                videoElement.play();
                remoteVideoParent.appendChild(videoElement);
            },
            cleanup: function () {
                var localVideoParent = document.getElementById('respokeLocalVideo');
                var remoteVideoParent = document.getElementById('respokeRemoteVideo');
                localVideoParent.innerHTML = "";
                remoteVideoParent.innerHTML = "";
            }
        };
    }
];
