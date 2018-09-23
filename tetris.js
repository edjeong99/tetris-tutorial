let canvas1 = document.getElementById("board");
let ctx = canvas1.getContext("2d");
let linecount = document.getElementById("lines");
let clear = window
  .getComputedStyle(canvas1)
  .getPropertyValue("background-color");
let width = 10;
let height = 20;
let tilesz = 24;
let WALL = 1;
let BLOCK = 2;
let lines = 0;
let done = false;
let playing = false;
let dropStart = Date.now();
let downI = {};
let board = [];
let piece;

let startBtn = document.querySelector(".start");
let stopBtn = document.querySelector(".stop");
let newBtn = document.querySelector(".new");

let dropSpeed = 1000; // speed of piece moving.  The less the value, faster moving.
let minDropSpeed = 300;
let dropSpeedChange = 50;
let lastSpeedChangeLine = 0;
let numLineforChangeSpeed = 2; // change speed after this number of lines are cleared

let pieces = [
  [I, "#cc99ff"],
  [J, "blue"],
  [L, "orange"],
  [O, "#cc6666"],
  [S, "green"],
  [T, "purple"],
  [Z, "red"]
];

canvas1.width = width * tilesz;
canvas1.height = height * tilesz;

for (let r = 0; r < height; r++) {
  board[r] = [];
  for (let c = 0; c < width; c++) {
    board[r][c] = "";
  }
}

function newPiece() {
  let p = pieces[Math.round(Math.random() * (pieces.length -1))];
  return new Piece(p[0], p[1]);
}

function drawSquare(x, y) {
  ctx.fillRect(x * tilesz, y * tilesz, tilesz, tilesz);
  let ss = ctx.strokeStyle;
  ctx.strokeStyle = "#555";
  ctx.strokeRect(x * tilesz, y * tilesz, tilesz, tilesz);
  ctx.strokeStyle = "#888";
//   ctx.strokeRect(
//     x * tilesz + (3 * tilesz) / 8,
//     y * tilesz + (3 * tilesz) / 8,
//     tilesz / 4,
//     tilesz / 4
//   );
  ctx.strokeStyle = ss;
}

class Piece {
  constructor(patterns, color) {
    this.pattern = patterns[0];
    this.patterns = patterns;
    this.patterni = 0;

    this.color = color;

    this.x = width / 2 - Math.round(this.pattern.length / 2);
    this.y = -2;
  }

  rotate() {
    let nudge = 0;
    let nextpat = this.patterns[(this.patterni + 1) % this.patterns.length];

    // if rotate fail due to wall, we move the piece one step left/right to succeed rotation
    if (this._collides(0, 0, nextpat)) {
      // Check kickback
      nudge = this.x > width / 2 ? -1 : 1;
    }

    if (!this._collides(nudge, 0, nextpat)) {
      this.undraw();
      this.x += nudge;
      this.patterni = (this.patterni + 1) % this.patterns.length;
      this.pattern = this.patterns[this.patterni];
      this.draw();
    }
  }

  // _collides checks if the piece can move/rotate
  _collides(dx, dy, pat) {
    for (let ix = 0; ix < pat.length; ix++) {
      for (let iy = 0; iy < pat.length; iy++) {
        if (!pat[ix][iy]) {
          continue;
        }

        let x = this.x + ix + dx;
        let y = this.y + iy + dy;
        if (y >= height || x < 0 || x >= width) {
          return WALL;
        }
        if (y < 0) {
          // Ignore negative space rows
          continue;
        }
        if (board[y][x] !== "") {
          return BLOCK;
        }
      }
    }

    return 0;
  }

  down() {
    if (this._collides(0, 1, this.pattern)) {
      this.lock();
      piece = newPiece();
    } else {
      this.undraw();
      this.y++;
      this.draw();
    }
  }

  moveRight() {
    if (!this._collides(1, 0, this.pattern)) {
      this.undraw();
      this.x++;
      this.draw();
    }
  }

  moveLeft() {
    if (!this._collides(-1, 0, this.pattern)) {
      this.undraw();
      this.x--;
      this.draw();
    }
  }

  // if piece hit something (floor or another piece) the piece is locked to current position
  lock() {
    for (let ix = 0; ix < this.pattern.length; ix++) {
      for (let iy = 0; iy < this.pattern.length; iy++) {
        if (!this.pattern[ix][iy]) {
          continue;
        }

        if (this.y + iy < 0) {
          // Game ends!
		  done = true;
		  stop();
		  alert("You're done!");
		  return;
        }
        board[this.y + iy][this.x + ix] = this.color;
      }
    }

    // when a line is cleared.  remove that line and
    // draw all existing pieces one line down

    let nlines = 0;
    for (let y = 0; y < height; y++) {
      let line = true;
      for (let x = 0; x < width; x++) {
        line = line && board[y][x] !== "";
      }
      if (line) {
        for (let y2 = y; y2 > 1; y2--) {
          for (let x = 0; x < width; x++) {
            board[y2][x] = board[y2 - 1][x];
          }
        }
        for (let x = 0; x < width; x++) {
          board[0][x] = "";
        }
        nlines++;
      }
    }

    if (nlines > 0) {
      lines += nlines;
      drawBoard();
	  linecount.textContent = "Lines: " + lines;
	  changeDropSpeed();
    }
  }

  _fill(color) {
    let fs = ctx.fillStyle;
    ctx.fillStyle = color;
    let x = this.x;
    let y = this.y;
    for (let ix = 0; ix < this.pattern.length; ix++) {
      for (let iy = 0; iy < this.pattern.length; iy++) {
        if (this.pattern[ix][iy]) {
          drawSquare(x + ix, y + iy);
        }
      }
    }
    ctx.fillStyle = fs;
  }

  undraw(ctx) {
    this._fill(clear);
  }

  draw(ctx) {
    this._fill(this.color);
  }
}

document.body.addEventListener(
  "keydown",
  function(e) {
    if (downI[e.keyCode] !== null) {
      clearInterval(downI[e.keyCode]);
    }
    key(e.keyCode);
    downI[e.keyCode] = setInterval(key.bind(this, e.keyCode), 200);
  },
  false
);

document.body.addEventListener(
  "keyup",
  function(e) {
    if (downI[e.keyCode] !== null) {
      clearInterval(downI[e.keyCode]);
    }
    downI[e.keyCode] = null;
  },
  false
);

function key(k) {
  if (done || !playing) {
    return;
  }
  if (k == 38) {
    // Player pressed up
    piece.rotate();
    // dropStart = Date.now();
  }
  if (k == 40) {
    // Player holding down
    piece.down();
  }
  if (k == 37) {
    // Player holding left
    piece.moveLeft();
    // dropStart = Date.now();
  }
  if (k == 39) {
    // Player holding right
    piece.moveRight();
    // dropStart = Date.now();
  }
}

function drawBoard() {
  let fs = ctx.fillStyle;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = board[y][x] || clear;
      drawSquare(x, y, tilesz, tilesz);
    }
  }
  ctx.fillStyle = fs;
}

function changeDropSpeed(){
	if (lines >=  numLineforChangeSpeed + lastSpeedChangeLine  && dropSpeed > minDropSpeed ){
		dropSpeed -= dropSpeedChange;
		lastSpeedChangeLine += numLineforChangeSpeed;
	}
}

function play() {
  let now = Date.now();
  let delta = now - dropStart;

  if (playing) {
    if (delta > dropSpeed) {
      piece.down();
      dropStart = now;
    }

    if (!done) {
      requestAnimationFrame(play);
    }
  }
}

function stop() {
  playing = false;
  stopBtn.classList.add("selected");
  startBtn.classList.remove("selected");
}

// initialize the game.  eventListner for buttons (play, stop, new)
function init() {
  piece = newPiece();
  drawBoard();
  linecount.textContent = "Lines: 0";
  play();

  startBtn.addEventListener("click", () => {
    startBtn.classList.add("selected");
    stopBtn.classList.remove("selected");
    playing = true;
    play();
  });
  stopBtn.addEventListener("click", () => stop());
  newBtn.addEventListener("click", () => init());
}

init();
