'use strict';
/**
 * Setting respoke video
 */
exports = module.exports = [
    function () {
        return {
            setLocalVideo: function (videoElement) {
                var videoParent = document.getElementById('respokeLocalVideo');
                videoParent.innerHTML = "";
                videoParent.appendChild(videoElement);
            },
            setRemoteVideo: function (videoElement) {
                var videoParent = document.getElementById('respokeRemoteVideo');
                videoParent.innerHTML = "";
                videoParent.appendChild(videoElement);
            }
        };
    }
];
