'use strict';
/**
 * Setting respoke video
 */
exports = module.exports = [
    function () {
        var localVideoParent = document.getElementById('respokeLocalVideo');
        var remoteVideoParent = document.getElementById('respokeRemoteVideo');
        return {
            setLocalVideo: function (videoElement) {
                // since it reuses the element, you must call play 
                // in case the call stops and then restarts.
                videoElement.play();
                localVideoParent.innerHTML = "";
                localVideoParent.appendChild(videoElement);
            },
            setRemoteVideo: function (videoElement) {
                remoteVideoParent.innerHTML = "";
                remoteVideoParent.appendChild(videoElement);
            },
            cleanup: function () {
                localVideoParent.innerHTML = "";
                remoteVideoParent.innerHTML = "";
            }
        };
    }
];
