    const FPS            = 60;                      //FPS frame updates
    const STEP_LENGTH_SECS           = 1/FPS;       // Frame time (s)
    const CANVAS_WIDTH          = 1024;            
    const CANVAS_HEIGHT         = 768;             
    const CENTRIFUGAL_FORCE    = 0.3;               // Turning circle 
    const OFFROAD_DECEL   = 0.99;                   // Amount of speed lost per frame 
    const SKY_SPEED       = 0.001;                  // Background parallax scroll speed
    const HILL_SPEED      = 0.002;                  // Background parallax scroll speed for hills
    const TREE_SPEED      = 0.003;                  // Combination of hill and curve scrolling
    const DRAW_DISTANCE   = 300;                    // No. of segments drawing
    const SEGMENT_LENGTH  = 200;                   
    const RUMBLE_LENGTH   = 3;                      // No. of segments per rumble strip stripe
    const FIELD_OF_VIEW_ANGLE    = 100;             // FOV
    const CAMERA_HEIGHT   = 1000;                    // Camera position
    const CAMERA_DEPTH  = 1 / Math.tan((FIELD_OF_VIEW_ANGLE/2) * Math.PI/180);
    const PLAYER_Z  = (CAMERA_HEIGHT * CAMERA_DEPTH);  // Player Z position
    const RESOLUTION = CANVAS_HEIGHT/480;  // Resolution in pixels
    const ROAD_WIDTH = 1500;                   
    const NUM_LANES  = 4;                      
    const FOG_DENSITY = 5;                      
    
    const MAX_SPEED       = SEGMENT_LENGTH/STEP_LENGTH_SECS;  // Collision detection
    const ACCEL_RATE      =  MAX_SPEED/5;             // Acceleration
    const BRAKE_RATE      = -MAX_SPEED;               // Deceleration
    const DECELERATION    = -MAX_SPEED/5;             // Natural decel
    const OFF_ROAD_DECEL  = -MAX_SPEED/2;             // Off road decel
    const OFF_ROAD_LIMIT  =  MAX_SPEED/4;             // Other decelaration limit

    let skyOffset      = 0;                       
    let hillOffset     = 0;                       
    let treeOffset     = 0;                       
        
    let segments       = [];                      // Road segment order
    let trackLength    = null;                    // Z position 

    const canvas         = Dom.get('canvas');     
    canvas.width  = CANVAS_WIDTH;                 
    canvas.height = CANVAS_HEIGHT;                
    const ctx = canvas.getContext('2d');         
    
    var background     = null;                    
    var sprites        = null;                    
    
    let playerX        = 0;                       
    let position       = 0;                       
    let currentSpeed          = 0;                 
    let gameMode = null;
    let lapCount = 0;
        
    
    let currentLapTime = 0;                       
    let lastLapTime    = null;                    

    let keyLeftPressed        = false;
    let keyRightPressed       = false;
    let keyFasterPressed      = false;
    let keySlowerPressed      = false;
    let keyAnswerPressed      = false;

    const hud = {
      speed:            { value: null, dom: Dom.get('speed_value')            },
      current_lap_time: { value: null, dom: Dom.get('current_lap_time_value') },
      last_lap_time:    { value: null, dom: Dom.get('last_lap_time_value')    },
      fast_lap_time:    { value: null, dom: Dom.get('fast_lap_time_value')    },
      current_lane:    { value: null, dom: Dom.get('current_lane_value')    }
    }

    // Updates all the game elements

    function update(dt) {

      var playerSegment = findSegment(position+PLAYER_Z);
      var playerW       = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
      var speedPercent  = currentSpeed/MAX_SPEED;
      var dx            = dt * 2 * speedPercent; 
      var startPosition = position;

      position = Util.increase(position, dt * currentSpeed, trackLength);
      if (gameMode !== 'playing' && position > 0) {
        const lapStart = document.getElementById('current_lap_time_value')
        const endGame = document.getElementById('endGame');

        if (gameMode == 'lap') {
          Game.pause();
          lapStart.dispatchEvent(new Event('lapend', {lapCount: lapCount}));
          endGame.dispatchEvent(new Event('end', {end: true}));

          lapCount++;
          
        }
        gameMode = 'playing';
        lapStart.dispatchEvent(new Event('lapstart', {lapCount: lapCount}));

        
      }
      if(keyAnswerPressed){
        keyAnswerPressed = false;
        const lane_index = playerX < -0.5 ? 0 : playerX < 0 ? 1 : playerX < 0.5 ? 2 : 3;
        const clv = document.getElementById('current_lane_value')
        clv.dispatchEvent(new Event('selectanswer', {lane: lane_index}));
      }

      if (keyLeftPressed)
        playerX = playerX - dx;
      else if (keyRightPressed)
        playerX = playerX + dx;

      playerX = playerX - (dx * speedPercent * playerSegment.curve * CENTRIFUGAL_FORCE);

      if (keyFasterPressed)
        currentSpeed = Util.accelerate(currentSpeed, ACCEL_RATE, dt);
      else if (keySlowerPressed)
        currentSpeed = Util.accelerate(currentSpeed, BRAKE_RATE, dt);
      else
        currentSpeed = Util.accelerate(currentSpeed, DECELERATION, dt);


      if ((playerX < -1) || (playerX > 1)) {

        if (currentSpeed > OFF_ROAD_LIMIT)
          currentSpeed = Util.accelerate(currentSpeed, OFFROAD_DECEL, dt);

        for(let n = 0 ; n < playerSegment.sprites.length ; n++) {
          const sprite  = playerSegment.sprites[n];
          const spriteW = sprite.source.w * SPRITES.SCALE;
          if (Util.overlap(playerX, playerW, sprite.offset + spriteW/2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
            currentSpeed = MAX_SPEED/5;
            position = Util.increase(playerSegment.p1.world.z, -PLAYER_Z, trackLength); // stop in front of sprite (at front of segment)
            break;
          }
        }
      }

      playerX = Util.limit(playerX, -3, 3);  // Player boundaries
      currentSpeed   = Util.limit(currentSpeed, 0, MAX_SPEED); 

      
      skyOffset  = Util.increase(skyOffset,  SKY_SPEED  * playerSegment.curve * (position-startPosition)/SEGMENT_LENGTH, 1);
      hillOffset = Util.increase(hillOffset, HILL_SPEED * playerSegment.curve * (position-startPosition)/SEGMENT_LENGTH, 1);
      treeOffset = Util.increase(treeOffset, TREE_SPEED * playerSegment.curve * (position-startPosition)/SEGMENT_LENGTH, 1);

      if (position > PLAYER_Z) {
        if (currentLapTime && (startPosition < PLAYER_Z)) {
          gameMode = 'lap';
          lastLapTime = currentLapTime;
          currentLapTime = 0;
          if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
            Dom.storage.fast_lap_time = lastLapTime;
            updateHud('fast_lap_time', formatTime(lastLapTime));
            Dom.addClassName('fast_lap_time', 'fastest');
            Dom.addClassName('last_lap_time', 'fastest');
          }
          else {
            Dom.removeClassName('fast_lap_time', 'fastest');
            Dom.removeClassName('last_lap_time', 'fastest');
          }
          updateHud('last_lap_time', formatTime(lastLapTime));
          Dom.show('last_lap_time');
        }
        else {
          currentLapTime += dt;
        }
      }

      updateHud('speed',            5 * Math.round(currentSpeed/500));
      updateHud('current_lap_time', formatTime(currentLapTime));
      
      const lane_index = playerX < -0.5 ? 0 : playerX < 0 ? 1 : playerX < 0.5 ? 2 : 3;
      updateHud('current_lane', lane_index);
    }

    function updateHud(key, value) { 
      if (hud[key].value !== value) {
        hud[key].value = value;
        Dom.set(hud[key].dom, value);
        if(key === 'current_lane') {
          const clv = document.getElementById('current_lane_value')
          clv.dispatchEvent(new Event('lanechange', {lane: value}));
      }
    }
  }
    function formatTime(dt) {
      var minutes = Math.floor(dt/60);
      var seconds = Math.floor(dt - (minutes * 60));
      var tenths  = Math.floor(10 * (dt - Math.floor(dt)));
      if (minutes > 0)
        return minutes + "." + (seconds < 10 ? "0" : "") + seconds + "." + tenths;
      else
        return seconds + "." + tenths;
    }

    // Rendering the game 

    function render() {

      const baseSegment   = findSegment(position);
      const basePercent   = Util.percentRemaining(position, SEGMENT_LENGTH);
      const playerSegment = findSegment(position+PLAYER_Z);
      const playerPercent = Util.percentRemaining(position+PLAYER_Z, SEGMENT_LENGTH);
      const playerY       = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
      let maxy          = CANVAS_HEIGHT;

      var x  = 0;
      var dx = - (baseSegment.curve * basePercent);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      Render.background(ctx, background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.SKY,   skyOffset,  RESOLUTION * SKY_SPEED  * playerY);
      Render.background(ctx, background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.HILLS, hillOffset, RESOLUTION * HILL_SPEED * playerY);
      Render.background(ctx, background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.TREES, treeOffset, RESOLUTION * TREE_SPEED * playerY);

      for(let n = 0 ; n < DRAW_DISTANCE ; n++) {

        const segment  = segments[(baseSegment.index + n) % segments.length];
        segment.looped = segment.index < baseSegment.index;
        segment.fog    = Util.exponentialFog(n/DRAW_DISTANCE, FOG_DENSITY);
        segment.clip   = maxy;

        Util.project(segment.p1, (playerX * ROAD_WIDTH) - x,      playerY + CAMERA_HEIGHT, position - (segment.looped ? trackLength : 0), CAMERA_DEPTH, CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_WIDTH);
        Util.project(segment.p2, (playerX * ROAD_WIDTH) - x - dx, playerY + CAMERA_HEIGHT, position - (segment.looped ? trackLength : 0), CAMERA_DEPTH, CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_WIDTH);

        x  = x + dx;
        dx = dx + segment.curve;

        if ((segment.p1.camera.z <= CAMERA_DEPTH)         || 
            (segment.p2.screen.y >= segment.p1.screen.y) || 
            (segment.p2.screen.y >= maxy))                  
          continue;

        Render.segment(ctx, CANVAS_WIDTH, NUM_LANES,
                       segment.p1.screen.x,
                       segment.p1.screen.y,
                       segment.p1.screen.w,
                       segment.p2.screen.x,
                       segment.p2.screen.y,
                       segment.p2.screen.w,
                       segment.fog,
                       segment.color);

        maxy = segment.p1.screen.y;
      }

      for(let n = (DRAW_DISTANCE-1) ; n > 0 ; n--) {
        segment = segments[(baseSegment.index + n) % segments.length];

        for(let i = 0 ; i < segment.sprites.length ; i++) {
          const sprite      = segment.sprites[i];
          const spriteScale = segment.p1.screen.scale;
          const spriteX     = segment.p1.screen.x + (spriteScale * sprite.offset * ROAD_WIDTH * CANVAS_WIDTH/2);
          const spriteY     = segment.p1.screen.y;
          Render.sprite(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, RESOLUTION, ROAD_WIDTH, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
        }

        if (segment == playerSegment) {
          Render.player(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, RESOLUTION, ROAD_WIDTH, sprites, currentSpeed/MAX_SPEED,
                        CAMERA_DEPTH/PLAYER_Z,
                        CANVAS_WIDTH/2,
                        (CANVAS_HEIGHT/2) - (CAMERA_DEPTH/PLAYER_Z * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * CANVAS_HEIGHT/2),
                        currentSpeed * (keyLeftPressed ? -1 : keyRightPressed ? 1 : 0),
                        playerSegment.p2.world.y - playerSegment.p1.world.y);
        }
      }
    }

    function findSegment(z) {
      return segments[Math.floor(z/SEGMENT_LENGTH) % segments.length]; 
    }

       
    // Game loop
     
    const options = {
      canvas: canvas, render: render, update: update, step: STEP_LENGTH_SECS,
      images: ["background", "sprites"],
      keys: [
        { keys: [KEY.LEFT,  KEY.A], mode: 'down', action: function() { keyLeftPressed   = true;  } },
        { keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function() { keyRightPressed  = true;  } },
        { keys: [KEY.UP,    KEY.W], mode: 'down', action: function() { keyFasterPressed = true;  } },
        { keys: [KEY.DOWN,  KEY.S], mode: 'down', action: function() { keySlowerPressed = true;  } },
        { keys: [KEY.LEFT,  KEY.A], mode: 'up',   action: function() { keyLeftPressed   = false; } },
        { keys: [KEY.RIGHT, KEY.D], mode: 'up',   action: function() { keyRightPressed  = false; } },
        { keys: [KEY.UP,    KEY.W], mode: 'up',   action: function() { keyFasterPressed = false; } },
        { keys: [KEY.DOWN,  KEY.S], mode: 'up',   action: function() { keySlowerPressed = false; } },
        { keys: [KEY.Q], mode: 'up',   action: function() { keyAnswerPressed = true; } },
        { keys: [KEY.Q], mode: 'down',   action: function() { keyAnswerPressed = false; } }
      ],
      ready: function(images) {
        background = images[0];
        sprites    = images[1];
        segments = Track.getTrackSegments(PLAYER_Z);
        trackLength = Track.trackLength;
        Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
        updateHud('fast_lap_time', formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
      }
    }
  
    Game.run(options);
