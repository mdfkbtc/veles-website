// Wrapper object
var indexHeaderWidget = {};

(function() {

    var width, height, largeHeader, canvas, ctx, points, target, animateHeader = true;

    indexHeaderWidget.init = function() {
        // Main
        initHeader();
        initAnimation();
        addListeners();
    }

    function initHeader() {
        //width = window.innerWidth;
        //height = window.innerHeight;
        width = $('.movething').width();
        height = $('.movething').height();

        target = {x: width/2, y: height/2};

        largeHeader = document.getElementById('large-header');
        largeHeader.style.height = height+'px';

        canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        initPoints();
    }

    function initPoints() {
         // create movable points
        points = [];
        for(var x = 0; x < width; x = x + width / 10 / $('.movething').css('zoom')) {   /* / 10 */
            for(var y = 0; y < height; y = y + height / 10) {
                var px = x + Math.random()*width / 10;
                var py = y + Math.random()*height / 10;
                var p = {x: px, originX: px, y: py, originY: py, isStatic: false };
                points.push(p);
            }
        }
        // create static points
        for(var x = 0; x < width; x = x + width / 5 / $('.movething').css('zoom')) {
            for(var y = 0; y < height; y = y + height / 10) {
                var px = x + Math.random()*width / 10;
                var py = y + Math.random()*height / 10;
                var p = {x: px, originX: px, y: py, originY: py, isStatic: true };
                points.push(p);
            }
        }

        // for each point find the 5 closest points
        for(var i = 0; i < points.length; i++) {
            var closest = [];
            var p1 = points[i];
            for(var j = 0; j < points.length; j++) {
                var p2 = points[j]
                if(!(p1 == p2)) {
                    var placed = false;
                    for(var k = 0; k < 5; k++) {
                        if(!placed) {
                            if(closest[k] == undefined) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }

                    for(var k = 0; k < 5; k++) {
                        if(!placed) {
                            if(getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }
                }
            }
            p1.closest = closest;
        }

        // assign a circle to each point
        for(var i in points) {
            var c = new Circle(points[i], 2+Math.random()*2, 'rgba(255,255,255,0.3)');
            points[i].circle = c;
        }
    }

    // Event handling
    function addListeners() {
        if(!('ontouchstart' in window)) {
            window.addEventListener('mousemove', mouseMove);
        }
        window.addEventListener('scroll', scrollCheck);
        window.addEventListener('resize', resize);
    }

    function mouseMove(e) {
        var posx = posy = 0;
        var maxX = $('.movething').width();
        var maxY= $('.movething').height();

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY)    {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        /* baggins: zoom support, keep animation inside the canvas */
        target.x = Math.min(posx / $('.movething').css('zoom'), maxX);
        target.y = Math.min(posy / $('.movething').css('zoom'), maxY);
    }

    function scrollCheck() {
        if(document.body.scrollTop > height) animateHeader = false;
        else animateHeader = true;
    }

    function resize() {
        //width = window.innerWidth;
        //height = window.innerHeight;
        width = $('.movething').width();
        height = $('.movething').height();
        largeHeader.style.height = height+'px';
        canvas.width = width;
        canvas.height = height;
        initPoints();   // Baggins: fix for resize
        initAnimation();
        target = {x: width/2, y: height/2};    // Re-center the animation
    }

    // animation
    function initAnimation() {
        animate();
        for(var i in points) {
            shiftPoint(points[i]);
        }
    }

    function animate() {
        if(animateHeader) {
            ctx.clearRect(0,0,width,height);
            for(var i in points) {
                // detect points in range
                if(Math.abs(getDistance(target, points[i])) < 4000) {
                    points[i].active = 0.3;
                    points[i].circle.active = 0.6;
                } else if(Math.abs(getDistance(target, points[i])) < 20000) {
                    points[i].active = 0.1;
                    points[i].circle.active = 0.3;
                } else if(Math.abs(getDistance(target, points[i])) < 40000) {
                    points[i].active = 0.02;
                    points[i].circle.active = 0.1;
                } else {
                    points[i].active = 0;
                    points[i].circle.active = 0;
                }

                drawLines(points[i]);
                points[i].circle.draw();
            }
        }
        requestAnimationFrame(animate);
    }

    function shiftPoint(p) {
        if (!p.isStatic) {
            TweenLite.to(p, 1+1*Math.random(), {x:p.originX-50+Math.random()*100,
                y: p.originY-50+Math.random()*100, ease:Circ.easeInOut,
                onComplete: function() {
                    shiftPoint(p);
                }});
        }
    }

    // Canvas manipulation
    function drawLines(p) {
        if(!p.active) return;
        for(var i in p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);
            ctx.strokeStyle = 'rgba(228,185,156,'+ p.active+')';
            ctx.stroke();
        }
    }

    function Circle(pos,rad,color) {
        var _this = this;

        // constructor
        (function() {
            _this.pos = pos || null;
            _this.radius = rad || null;
            _this.color = color || null;
        })();

        this.draw = function() {
            if(!_this.active) return;
            ctx.beginPath();
            
            if (pos.isStatic) {
                ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'rgba(155, 255,126,' + Math.min(_this.active * 1.2, 1) + ')';
            } else {
                ctx.arc(_this.pos.x, _this.pos.y, Math.max(_this.radius - 1, 2), 0, 2 * Math.PI, false);
                ctx.fillStyle = 'rgba(228,185,156,' + (_this.active * 0.8) + ')';
            }
            ctx.fill();
        };
    }

    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }

})();
