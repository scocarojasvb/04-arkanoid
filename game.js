const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 90;
const BRICK_H = 30;
const BRICK_GAP = 10;
const BRICK_OFFSET_X = ( canvas.width - ( BRICK_COLS * BRICK_W + ( BRICK_COLS - 1 ) * BRICK_GAP ) ) / 2;
const BRICK_OFFSET_Y = 60;
const BRICK_ROW_COLORS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink' ];

const INITIAL_PADDLE = { x: 320, y: 560, w: 100, h: 14 };
const INITIAL_BALL = { x: 400, y: 300, vx: 4, vy: -4, radius: 8 };

const HIGHSCORE_KEY = 'arkanoid:highscore:v1';

const state = {
  status: 'playing', // 'playing' | 'paused' | 'won' | 'gameover'
  score: 0,
  lives: 3,
  highScore: Number( localStorage.getItem( HIGHSCORE_KEY ) ) || 0,
  paddle: { ...INITIAL_PADDLE },
  ball: { ...INITIAL_BALL },
  bricks: [],
};

function createBricks() {
  const bricks = [];
  for ( let row = 0; row < BRICK_ROWS; row++ ) {
    for ( let col = 0; col < BRICK_COLS; col++ ) {
      bricks.push( {
        x: BRICK_OFFSET_X + col * ( BRICK_W + BRICK_GAP ),
        y: BRICK_OFFSET_Y + row * ( BRICK_H + BRICK_GAP ),
        w: BRICK_W,
        h: BRICK_H,
        color: BRICK_ROW_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return bricks;
}

state.bricks = createBricks();

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

function drawWinScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = '48px sans-serif';
  ctx.fillText( '¡Ganaste!', canvas.width / 2, canvas.height / 2 - 20 );

  ctx.font = '20px sans-serif';
  ctx.fillText( 'Presiona ENTER para jugar de nuevo', canvas.width / 2, canvas.height / 2 + 30 );
  ctx.textAlign = 'left';
}

function render() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );
  drawBricks();
  drawPaddle();
  drawBall();
  drawScore();
  drawLives();

  if ( state.status === 'gameover' ) {
    drawGameOverScreen();
  } else if ( state.status === 'won' ) {
    drawWinScreen();
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

  if ( e.key === 'Enter' && ( state.status === 'gameover' || state.status === 'won' ) ) {
    restartGame();
  }

  if ( e.key.toLowerCase() === 'p' ) {
    if ( state.status === 'playing' ) {
      state.status = 'paused';
    } else if ( state.status === 'paused' ) {
      state.status = 'playing';
    }
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

const BALL_SPEED = Math.hypot( state.ball.vx, state.ball.vy );
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
  if ( state.bricks.every( ( brick ) => !brick.alive ) ) {
    state.status = 'won';
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
  state.bricks = createBricks();
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
  } else if ( ball.x + ball.radius >= canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.vx = -ball.vx;
  }

  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.vy = -ball.vy;
  } else if ( checkPaddleCollision() ) {
    // rebote resuelto en checkPaddleCollision
  } else if ( ball.y + ball.radius >= canvas.height ) {
    loseLife();
  }
}

function update() {
  updatePaddleKeyboard();
  updateBall();
}

function loop() {
  update();
  render();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
