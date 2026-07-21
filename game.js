const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BRICK_W = 90;
const BRICK_H = 30;
const BRICK_GAP = 10;
const BRICK_OFFSET_Y = 60;

const LEVELS = [
  {
    rows: 5,
    cols: 8,
    colorPattern: [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink' ],
  },
  {
    rows: 6,
    cols: 8,
    colorPattern: [ 'cyan', 'magenta', 'yellow', 'red', 'hotpink', 'cyan' ],
    // Tablero en damero: deja huecos que obligan a cambiar la trayectoria de la bola.
    isBrickAt: ( row, col ) => ( row + col ) % 2 === 0,
  },
  {
    rows: 7,
    cols: 10,
    colorPattern: [ 'hotpink', 'red', 'magenta', 'yellow', 'cyan', 'gray' ],
    // Pirámide invertida: cada fila hacia abajo es más angosta.
    isBrickAt: ( row, col, rows, cols ) => {
      const margin = row;
      return col >= margin && col < cols - margin;
    },
  },
];

const INITIAL_PADDLE = { x: 320, y: 560, w: 100, h: 14 };
const INITIAL_BALL = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };

const HIGHSCORE_KEY = 'arkanoid:highscore:v1';
const MUTED_KEY = 'arkanoid:muted:v1';

const SOUND_BALL_BOUNCE = 'assets/sounds/ball-bounce.mp3';
const SOUND_BREAK = 'assets/sounds/break-sound.mp3';
const LEVEL_COMPLETE_BONUS = 100;

const audioCache = {};

function getAudio( src ) {
  if ( !audioCache[ src ] ) {
    const audio = new Audio( src );
    audio.preload = 'auto';
    audio.load();
    audioCache[ src ] = audio;
  }
  return audioCache[ src ];
}

[ SOUND_BALL_BOUNCE, SOUND_BREAK ].forEach( getAudio );

function playSound( src ) {
  if ( state.muted ) return;
  const audio = getAudio( src );
  audio.currentTime = 0;
  audio.play();
}

const state = {
  status: 'playing', // 'playing' | 'paused' | 'levelComplete' | 'gameComplete' | 'gameover'
  score: 0,
  lives: 3,
  highScore: Number( localStorage.getItem( HIGHSCORE_KEY ) ) || 0,
  paddle: { ...INITIAL_PADDLE },
  ball: { ...INITIAL_BALL },
  bricks: [],
  explosions: [],
  muted: localStorage.getItem( MUTED_KEY ) === 'true',
  level: 1,
  levelMessage: null,
};

function generateBricks( levelConfig ) {
  const { rows, cols, colorPattern, isBrickAt } = levelConfig;
  const offsetX = ( canvas.width - ( cols * BRICK_W + ( cols - 1 ) * BRICK_GAP ) ) / 2;
  const bricks = [];
  for ( let row = 0; row < rows; row++ ) {
    for ( let col = 0; col < cols; col++ ) {
      if ( isBrickAt && !isBrickAt( row, col, rows, cols ) ) continue;
      bricks.push( {
        x: offsetX + col * ( BRICK_W + BRICK_GAP ),
        y: BRICK_OFFSET_Y + row * ( BRICK_H + BRICK_GAP ),
        w: BRICK_W,
        h: BRICK_H,
        color: colorPattern[ row % colorPattern.length ],
        alive: true,
      } );
    }
  }
  return bricks;
}

state.bricks = generateBricks( LEVELS[ state.level - 1 ] );

function drawPaddle() {
  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
}

function drawBall() {
  const ball = state.ball;
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
}

function drawBricks() {
  state.bricks.forEach( ( brick ) => {
    if ( !brick.alive ) return;
    drawSprite( ctx, 'block_' + brick.color, brick.x, brick.y, brick.w, brick.h );
  } );
}

function drawExplosions() {
  state.explosions.forEach( ( explosion ) => {
    const frames = EXPLOSION_FRAMES[ explosion.color ];
    const elapsed = performance.now() - explosion.startTime;
    const frameIndex = Math.min(
      frames.length - 1,
      Math.floor( elapsed / ( EXPLOSION_DURATION / frames.length ) )
    );
    drawFrame( ctx, frames[ frameIndex ], explosion.x, explosion.y, BRICK_W, BRICK_H );
  } );

  state.explosions = state.explosions.filter(
    ( explosion ) => performance.now() - explosion.startTime < EXPLOSION_DURATION
  );
}

const LIFE_ICON_SIZE = 20;
const LIFE_ICON_GAP = 8;
const LIFE_ICON_MARGIN = 10;

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText( 'Score: ' + state.score, 10, 10 );
  ctx.fillText( 'Highscore: ' + state.highScore, 10, 35 );
}

function drawSoundStatus() {
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText( 'Sonido: ' + ( state.muted ? 'OFF' : 'ON' ), canvas.width - LIFE_ICON_MARGIN, canvas.height - LIFE_ICON_MARGIN - 20 );
  ctx.textAlign = 'left';
}

function drawLives() {
  for ( let i = 0; i < state.lives; i++ ) {
    const x = canvas.width - LIFE_ICON_MARGIN - ( i + 1 ) * ( LIFE_ICON_SIZE + LIFE_ICON_GAP ) + LIFE_ICON_GAP;
    drawSprite( ctx, 'ball', x, LIFE_ICON_MARGIN, LIFE_ICON_SIZE, LIFE_ICON_SIZE );
  }
}

function drawGameOverScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '48px sans-serif';
  ctx.fillText( 'Game Over', canvas.width / 2, canvas.height / 2 - 20 );

  ctx.font = '20px sans-serif';
  ctx.fillText( 'Presiona ENTER para reiniciar', canvas.width / 2, canvas.height / 2 + 30 );
  ctx.textAlign = 'left';
}

function drawPauseIndicator() {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '48px sans-serif';
  ctx.fillText( 'Pausado', canvas.width / 2, canvas.height / 2 );
  ctx.textAlign = 'left';
}

const LEVEL_MESSAGE_DURATION = 3000;

function drawLevelCompleteScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '48px sans-serif';
  ctx.fillText( state.levelMessage.text, canvas.width / 2, canvas.height / 2 );
  ctx.textAlign = 'left';
}

function drawGameCompleteScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '48px sans-serif';
  ctx.fillText( '¡Completaste el juego!', canvas.width / 2, canvas.height / 2 - 20 );

  ctx.font = '20px sans-serif';
  ctx.fillText( 'Presiona ENTER para jugar de nuevo', canvas.width / 2, canvas.height / 2 + 30 );
  ctx.textAlign = 'left';
}

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  drawBricks();
  drawExplosions();
  drawPaddle();
  drawBall();
  drawScore();
  drawLives();
  drawSoundStatus();

  if ( state.status === 'gameover' ) {
    drawGameOverScreen();
  } else if ( state.status === 'gameComplete' ) {
    drawGameCompleteScreen();
  } else if ( state.status === 'levelComplete' ) {
    drawLevelCompleteScreen();
  } else if ( state.status === 'paused' ) {
    drawPauseIndicator();
  }
}

const PADDLE_SPEED = 8;
const keys = {};

function clampPaddleX( x ) {
  return Math.max( 0, Math.min( canvas.width - state.paddle.w, x ) );
}

window.addEventListener( 'keydown', ( e ) => {
  keys[ e.key.toLowerCase() ] = true;

  if ( e.key === 'Enter' && ( state.status === 'gameover' || state.status === 'gameComplete' ) ) {
    restartGame();
  }

  if ( e.key.toLowerCase() === 'p' ) {
    if ( state.status === 'playing' ) {
      state.status = 'paused';
    } else if ( state.status === 'paused' ) {
      state.status = 'playing';
    }
  }

  if ( e.key.toLowerCase() === 'm' ) {
    state.muted = !state.muted;
    localStorage.setItem( MUTED_KEY, String( state.muted ) );
  }
} );

window.addEventListener( 'keyup', ( e ) => {
  keys[ e.key.toLowerCase() ] = false;
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  if ( state.status !== 'playing' ) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = ( e.clientX - rect.left ) * scaleX;
  state.paddle.x = clampPaddleX( mouseX - state.paddle.w / 2 );
} );

function updatePaddleKeyboard() {
  if ( state.status !== 'playing' ) return;
  if ( keys[ 'arrowleft' ] || keys[ 'a' ] ) {
    state.paddle.x = clampPaddleX( state.paddle.x - PADDLE_SPEED );
  }
  if ( keys[ 'arrowright' ] || keys[ 'd' ] ) {
    state.paddle.x = clampPaddleX( state.paddle.x + PADDLE_SPEED );
  }
}

const BALL_SPEED = Math.hypot( INITIAL_BALL.vx, INITIAL_BALL.vy );
const PADDLE_MAX_BOUNCE_ANGLE = Math.PI / 3; // 60 grados desde la vertical

function checkPaddleCollision() {
  const ball = state.ball;
  const paddle = state.paddle;

  if ( ball.vy <= 0 ) return false;
  if ( ball.y + ball.radius < paddle.y ) return false;
  if ( ball.y - ball.radius > paddle.y + paddle.h ) return false;
  if ( ball.x + ball.radius < paddle.x ) return false;
  if ( ball.x - ball.radius > paddle.x + paddle.w ) return false;

  const paddleCenter = paddle.x + paddle.w / 2;
  const hitPos = Math.max( -1, Math.min( 1, ( ball.x - paddleCenter ) / ( paddle.w / 2 ) ) );
  const angle = hitPos * PADDLE_MAX_BOUNCE_ANGLE;

  ball.vx = BALL_SPEED * Math.sin( angle );
  ball.vy = -BALL_SPEED * Math.cos( angle );
  ball.y = paddle.y - ball.radius;

  playSound( SOUND_BALL_BOUNCE );

  return true;
}

function checkBrickCollision() {
  const ball = state.ball;

  for ( const brick of state.bricks ) {
    if ( !brick.alive ) continue;
    if ( ball.x + ball.radius < brick.x || ball.x - ball.radius > brick.x + brick.w ) continue;
    if ( ball.y + ball.radius < brick.y || ball.y - ball.radius > brick.y + brick.h ) continue;

    brick.alive = false;
    state.score += 10;
    updateHighScore();
    playSound( SOUND_BREAK );

    state.explosions.push( {
      x: brick.x,
      y: brick.y,
      color: brick.color,
      startTime: performance.now(),
    } );

    const overlapLeft = ball.x + ball.radius - brick.x;
    const overlapRight = brick.x + brick.w - ( ball.x - ball.radius );
    const overlapTop = ball.y + ball.radius - brick.y;
    const overlapBottom = brick.y + brick.h - ( ball.y - ball.radius );

    const minOverlapX = Math.min( overlapLeft, overlapRight );
    const minOverlapY = Math.min( overlapTop, overlapBottom );

    if ( minOverlapX < minOverlapY ) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }

    break;
  }
}

function updateHighScore() {
  if ( state.score > state.highScore ) {
    state.highScore = state.score;
    localStorage.setItem( HIGHSCORE_KEY, String( state.highScore ) );
  }
}

function checkVictory() {
  if ( state.bricks.every( ( brick ) => !brick.alive ) && state.explosions.length === 0 ) {
    state.score += LEVEL_COMPLETE_BONUS;
    updateHighScore();

    if ( state.level < LEVELS.length ) {
      state.status = 'levelComplete';
      state.levelMessage = { text: 'Nivel ' + state.level + ' completado', startTime: performance.now() };
    } else {
      state.status = 'gameComplete';
    }
  }
}

function resetBallAndPaddle() {
  Object.assign( state.ball, INITIAL_BALL );
  Object.assign( state.paddle, INITIAL_PADDLE );
}

function loseLife() {
  state.lives -= 1;
  if ( state.lives <= 0 ) {
    state.status = 'gameover';
  }
  resetBallAndPaddle();
}

function restartGame() {
  state.status = 'playing';
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.bricks = generateBricks( LEVELS[ state.level - 1 ] );
  resetBallAndPaddle();
}

function updateBall() {
  if ( state.status !== 'playing' ) return;

  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  checkBrickCollision();
  checkVictory();
  if ( state.status !== 'playing' ) return;

  if ( ball.x - ball.radius <= 0 ) {
    ball.x = ball.radius;
    ball.vx = -ball.vx;
    playSound( SOUND_BALL_BOUNCE );
  } else if ( ball.x + ball.radius >= canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.vx = -ball.vx;
    playSound( SOUND_BALL_BOUNCE );
  }

  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.vy = -ball.vy;
    playSound( SOUND_BALL_BOUNCE );
  } else if ( checkPaddleCollision() ) {
    // rebote resuelto en checkPaddleCollision
  } else if ( ball.y + ball.radius >= canvas.height ) {
    loseLife();
  }
}

function updateLevelTransition() {
  if ( state.status !== 'levelComplete' ) return;

  const elapsed = performance.now() - state.levelMessage.startTime;
  if ( elapsed < LEVEL_MESSAGE_DURATION ) return;

  state.levelMessage = null;
  state.level += 1;
  state.bricks = generateBricks( LEVELS[ state.level - 1 ] );
  resetBallAndPaddle();
  state.status = 'playing';
}

function update() {
  updatePaddleKeyboard();
  updateBall();
  updateLevelTransition();
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
