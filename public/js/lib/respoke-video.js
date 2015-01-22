/*!
 * Copyright 2014, Digium, Inc.
 * All rights reserved.
 *
 * This source code is licensed under The AGPL v3 License found in the
 * LICENSE file in the root directory of this source tree.
 *
 * For all details and documentation:  https://www.respoke.io
 */
/* global $ */
'use strict';
/**
 * A service for setting respoke video streams to the elements.
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
