/*!
* Courtesy of http://timothypoon.com/blog/demos/canvas-particle-parallax/
* Edited gingerly by @ruffrey
*/
(function () {
    'use strict';
    var TOTAL_PIXIES = 15;
    var WIDTH;
    var HEIGHT;
    var canvas;
    var con;
    var g;
    var pxs = [];
    var REDRAW_INTERVAL = 30;
    var INTERVAL;

    $(document).ready(function(){
        window.pixies.start();
        $(window).resize(function (evt) {
            var wasStopped = !window.pixies.isRunning;
            window.pixies.stop();
            window.pixies.start();
            if (wasStopped) {
                window.pixies.stop();
            }
        });
    });

    function Pixies () {
        var self = this;

        self.isRunning = false;

        self.start = function () {
            if (self.isRunning) {
                return; 
            }
            WIDTH = window.innerWidth;
            HEIGHT = window.innerHeight;
            $('#container').width(WIDTH).height(HEIGHT);
            canvas = document.getElementById('pixie');
            $(canvas).attr('width', WIDTH).attr('height',HEIGHT);
            con = canvas.getContext('2d');
            for (var i = 0; i < TOTAL_PIXIES; i++) {
                pxs[i] = new Circle();
                pxs[i].reset();
            }
            INTERVAL = setInterval(draw, REDRAW_INTERVAL);
            self.isRunning = true;
        };

        self.resume = function () {
            if (!self.isRunning) {
                INTERVAL = setInterval(draw, REDRAW_INTERVAL);
                self.isRunning = true;
            }
        };

        self.stop = function () {
            if (self.isRunning) {
                clearInterval(INTERVAL);
                self.isRunning = false;
            }
        };
    }
    window.pixies = new Pixies();

    function draw() {
        con.clearRect(0, 0, WIDTH,HEIGHT);
        for (var i = 0; i < pxs.length; i++) {
            pxs[i].fade();
            pxs[i].move();
            pxs[i].draw();
        }
    }

    function Circle() {
        this.s = {
            ttl: 8000,
            xmax: 5,
            ymax: 2,
            rmax: 10,
            rt: 1,
            xdef: 960,
            ydef: 540,
            xdrift: 4,
            ydrift:  4,
            random: true,
            blink: true
        };

        this.reset = function () {
            this.x = (this.s.random ? WIDTH*Math.random() : this.s.xdef);
            this.y = (this.s.random ? HEIGHT*Math.random() : this.s.ydef);
            this.r = ((this.s.rmax-1)*Math.random()) + 1;
            this.dx = (Math.random()*this.s.xmax) * (Math.random() < 0.5 ? -1 : 1);
            this.dy = (Math.random()*this.s.ymax) * (Math.random() < 0.5 ? -1 : 1);
            this.hl = (this.s.ttl/REDRAW_INTERVAL)*(this.r/this.s.rmax);
            this.rt = Math.random()*this.hl;
            this.s.rt = Math.random()+1;
            this.stop = Math.random()*0.2+0.4;
            this.s.xdrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
            this.s.ydrift *= Math.random() * (Math.random() < 0.5 ? -1 : 1);
        };

        this.fade = function () {
            this.rt += this.s.rt;
        };

        this.draw = function () {
            if(this.s.blink && (this.rt <= 0 || this.rt >= this.hl)) {
                this.s.rt = this.s.rt * -1;
            }
            else if(this.rt >= this.hl) {
                this.reset();
            }
            var newo = 1 - (this.rt / this.hl);
            con.beginPath();
            con.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
            con.closePath();
            var cr = this.r * newo;
            g = con.createRadialGradient(this.x, this.y, 0, this.x, this.y, (cr <= 0 ? 1 : cr));
            g.addColorStop(0.0, 'rgba(255,255,255,' + newo + ')');
            g.addColorStop(this.stop, 'rgba(77,101,181,' + (newo * 0.6) + ')');
            g.addColorStop(1.0, 'rgba(77,101,181,0)');
            con.fillStyle = g;
            con.fill();
        };

        this.move = function () {
            this.x += (this.rt/this.hl)*this.dx;
            this.y += (this.rt/this.hl)*this.dy;
            if (this.x > WIDTH || this.x < 0) {
                this.dx *= -1;
            }
            if (this.y > HEIGHT || this.y < 0) {
                this.dy *= -1;
            }
        };

        this.getX = function() {
            return this.x;
        };
        this.getY = function() {
            return this.y;
        };
    }

})();
