'use strict';
/**
 * Setting respoke video
 */
exports = module.exports = [
    function () {
        var remoteVideoParent = document.getElementById('respokeRemoteVideo');
        var localVideoParent = document.getElementById('respokeLocalVideo');
        return {
            setLocalVideo: function (videoElement) {
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
