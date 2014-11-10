/*!
 * Copyright (c) 2014, D.C.S. LLC. All Rights Reserved. Licensed Software.
 */
/* global $ */
'use strict';
/**
 * Setting respoke video
 */
function setRemoteVideoSize() {
    var $parent = $('#respokeRemoteVideo');
    var $vid = $('#respokeRemoteVideo video');
    var $window = $(window);


    if ($window.height() > $window.width()) {
        $parent.css('height', $window.height() + 'px');
        $parent.css('width', 'auto');
    } else {
        $parent.css('width', $window.width() + 'px');
        $parent.css('height', 'auto');
    }
}
exports = module.exports = [
    '$window',
    function ($window) {
        var doc = $window.document;
        return {
            setLocalVideo: function (stream) {
                // since it reuses the element, you must call play
                // in case the call stops and then restarts.
                var localVideoParent = doc.getElementById('respokeLocalVideo');
                var videoElement = doc.createElement('video');
                videoElement.src = $window.URL.createObjectURL(stream);
                videoElement.play();
                videoElement.muted = true;
                localVideoParent.appendChild(videoElement);
            },
            setRemoteVideo: function (stream) {
                var remoteVideoParent = doc.getElementById('respokeRemoteVideo');
                var videoElement = doc.createElement('video');
                videoElement.src = $window.URL.createObjectURL(stream);
                videoElement.play();
                videoElement.muted = true;
                remoteVideoParent.appendChild(videoElement);
                setRemoteVideoSize();
                $(window).on('resize', setRemoteVideoSize);
            },
            cleanup: function () {
                var localVideoParent = doc.getElementById('respokeLocalVideo');
                var remoteVideoParent = doc.getElementById('respokeRemoteVideo');
                $(window).off('resize', setRemoteVideoSize);
                localVideoParent.innerHTML = "";
                remoteVideoParent.innerHTML = "";
            }
        };
    }
];
