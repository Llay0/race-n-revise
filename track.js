const ROAD = {
    LENGTH: { NONE: 0, SHORT:  25, MEDIUM:   50, LONG:  100 },
    HILL:   { NONE: 0, LOW:    20, MEDIUM:   40, HIGH:   60 },
    CURVE:  { NONE: 0, EASY:    2, MEDIUM:    4, HARD:    6 }
  };

const Track = {
    segments: [],
    trackLength: 0,

    lastY: function(s) {
        return (s.length == 0) ? 0 : s[s.length-1].p2.world.y;
    },

    addSegment: function(curve, y) {
        var n = this.segments.length;
        this.segments.push({
            index: n,
            p1: { world: { y: this.lastY(this.segments), z:  n   *SEGMENT_LENGTH }, camera: {}, screen: {} },
            p2: { world: { y: y,       z: (n+1)*SEGMENT_LENGTH }, camera: {}, screen: {} },
            curve: curve,
            sprites: [],
            cars: [],
            color: Math.floor(n/RUMBLE_LENGTH)%2 ? COLORS.DARK : COLORS.LIGHT
        });
    },

    addSprite: function(n, sprite, offset) {
        this.segments[n].sprites.push({ source: sprite, offset: offset });
    },

    addRoad: function(enter, hold, leave, curve, y) {
        var startY   = this.lastY(this.segments);
        var endY     = startY + (Util.toInt(y, 0) * SEGMENT_LENGTH);
        var n, total = enter + hold + leave;
        for(n = 0 ; n < enter ; n++)
            this.addSegment(Util.easeIn(0, curve, n/enter), Util.easeInOut(startY, endY, n/total));
        for(n = 0 ; n < hold  ; n++)
            this.addSegment(curve, Util.easeInOut(startY, endY, (enter+n)/total));
        for(n = 0 ; n < leave ; n++)
            this.addSegment(Util.easeInOut(curve, 0, n/leave), Util.easeInOut(startY, endY, (enter+hold+n)/total));
    },

    addStraight: function(num) {
        num = num || ROAD.LENGTH.MEDIUM;
        this.addRoad(num, num, num, 0, 0);
    },

    addHill: function(num, height) {
        num    = num    || ROAD.LENGTH.MEDIUM;
        height = height || ROAD.HILL.MEDIUM;
        this.addRoad(num, num, num, 0, height);
    },

    addCurve: function(num, curve, height) {
        num    = num    || ROAD.LENGTH.MEDIUM;
        curve  = curve  || ROAD.CURVE.MEDIUM;
        height = height || ROAD.HILL.NONE;
        this.addRoad(num, num, num, curve, height);
    },

    addLowRollingHills: function(num, height) {
        num    = num    || ROAD.LENGTH.SHORT;
        height = height || ROAD.HILL.LOW;
        this.addRoad(num, num, num,  0,                height/2);
        this.addRoad(num, num, num,  0,               -height);
        this.addRoad(num, num, num,  ROAD.CURVE.EASY,  height);
        this.addRoad(num, num, num,  0,                0);
        this.addRoad(num, num, num, -ROAD.CURVE.EASY,  height/2);
        this.addRoad(num, num, num,  0,                0);
    },

    addSCurves: function() {
        this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.NONE);
        this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM,  ROAD.HILL.MEDIUM);
        this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY,   -ROAD.HILL.LOW);
        this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY,    ROAD.HILL.MEDIUM);
        this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
    },

    addBumps: function() {
        this.addRoad(10, 10, 10, 0,  5);
        this.addRoad(10, 10, 10, 0, -2);
        this.addRoad(10, 10, 10, 0, -5);
        this.addRoad(10, 10, 10, 0,  8);
        this.addRoad(10, 10, 10, 0,  5);
        this.addRoad(10, 10, 10, 0, -7);
        this.addRoad(10, 10, 10, 0,  5);
        this.addRoad(10, 10, 10, 0, -2);
    },

    addDownhillToEnd: function(num) {
        num = num || 200;
        this.addRoad(num, num, num, -ROAD.CURVE.EASY, -this.lastY(this.segments)/SEGMENT_LENGTH);
    },

    findSegment: function (z) {
        return this.segments[Math.floor(z/SEGMENT_LENGTH) % this.segments.length]; 
    },
  

    getTrackSegments: function(playerZ) {
        this.segments = [];
        this.addLowRollingHills();
        this.addSCurves();
        this.addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
        this.addBumps();
        this.addLowRollingHills();
        this.addCurve(ROAD.LENGTH.LONG*2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
        this.addStraight();
        this.addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
        this.addSCurves();
        this.addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
        this.addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
        this.addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
        this.addBumps();
        this.addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
        this.addStraight();
        this.addSCurves();
        this.addDownhillToEnd();

        this.segments[this.findSegment(playerZ).index + 2].color = COLORS.START;
        this.segments[this.findSegment(playerZ).index + 3].color = COLORS.START;

       

        for(var n = 0 ; n < RUMBLE_LENGTH ; n++)
            this.segments[this.segments.length-1-n].color = COLORS.FINISH;

        this.trackLength = this.segments.length * SEGMENT_LENGTH;
        return this.segments;
    }
};
