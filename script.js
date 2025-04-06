let tankSpriteSheet;
let explosionImage;
let tanks = [];
let projectiles = [];
let walls = [];
let scores = [];
let topMargin = 25;
let roundEnded = false;

let wasdTank, arrowTank, mouseTank;

let mouseTankImage;

function preload() {
  tankSpriteSheet = loadImage("tsprites.png");
  explosionImage = loadImage("explode.png");
  wasdTankImage = loadImage("future-tank.png"); // Custom sprite for wasdTank
  arrowTankImage = loadImage("et-tank.png"); // Custom sprite for arrowTank
  mouseTankImage = loadImage("old-tank.png"); // Custom sprite for mouseTank
}

function setup() {
  createCanvas(1200, 800);
  imageMode(CENTER);
  walls = getWalls();
  scores = [0, 0, 0];
  spawnTanks();
}

function draw() {
  background(100);

  // Draw walls
  for (let wall of walls) {
    fill(70);
    rect(wall.x, wall.y, wall.w, wall.h);
  }

  // Update tanks
  for (let tank of tanks) {
    tank.update();
    tank.draw((hitbox = false));
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.update();
    p.draw();
    if (p.isOffscreen()) {
      projectiles.splice(i, 1);
    }
  }

  // Handle collisions
  for (let proj of projectiles) {
    for (let tank of tanks) {
      if (
        tank !== proj.owner &&
        tank.health > 0 &&
        proj.x > tank.x - tank.width / 2 - 5 &&
        proj.x < tank.x + tank.width / 2 + 5 &&
        proj.y > tank.y - tank.height / 2 - 5 &&
        proj.y < tank.y + tank.height / 2 + 5
      ) {
        tank.health = 0;
        tank.isExploding = true;
        tank.explosionAlpha = 255;
        proj.hit = true;

        // ✅ Credit the kill to the owner of the projectile
        if (proj.owner && typeof proj.owner.playerIndex === "number") {
          scores[proj.owner.playerIndex]++;
        }
      }
    }
  }

  projectiles = projectiles.filter((p) => !p.isOffscreen() && !p.hit);
  tanks = tanks.filter((tank) => !tank.shouldRemove);

  // ✅ Game Over Detection + Reset
  let aliveTanks = tanks.filter((t) => t.health > 0);
  if (!roundEnded && aliveTanks.length === 1 && tanks.length > 1) {
    let winner = aliveTanks[0].playerIndex;
    scores[winner]++;
    roundEnded = true;
    setTimeout(() => {
      resetGame();
      roundEnded = false;
    }, 1500);
  }

  // FPS display
  fill(255);
  textSize(14);
  text("FPS: " + nf(frameRate(), 2, 1), 100, height - 20);

  // Draw leaderboard in top-right
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP);
  for (let i = 0; i < scores.length; i++) {
    let label =
      (i === 0 ? "WASD" : i === 1 ? "ARROWS" : "MOUSE") + ": " + scores[i];
    text(label, width - 10, 10 + i * 20);
  }
}
class Tank {
  constructor(
    x,
    y,
    spriteIndex,
    controlType,
    maxProjectiles = 2,
    customImage = null
  ) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.spriteIndex = spriteIndex;
    this.controlType = controlType;
    this.width = 40;
    this.height = 68;
    this.radius = 15; // Radius of the circular hitbox
    this.hitboxOffset_x = -8; // Shift hitbox downward relative to sprite center
    this.hitboxOffset_y = -1.5; // Shift hitbox downward relative to sprite center
    this.speed = 2;
    this.maxProjectiles = maxProjectiles;
    this.health = 1;
    this.isExploding = false;
    this.explosionAlpha = 255;
    this.customImage = customImage;
  }

  shoot() {
    const activeBullets = projectiles.filter((p) => p.owner === this);
    if (activeBullets.length >= this.maxProjectiles) return;
    let dx = Math.cos(this.angle - HALF_PI);
    let dy = Math.sin(this.angle - HALF_PI);
    projectiles.push(
      new Projectile(this.x + dx * 20, this.y + dy * 20, dx, dy, this)
    );
  }

  update() {
    let dx = 0;
    let dy = 0;

    if (this.controlType === 0) {
      if (keyIsDown(87)) dy -= this.speed;
      if (keyIsDown(83)) dy += this.speed;
      if (keyIsDown(65)) dx -= this.speed;
      if (keyIsDown(68)) dx += this.speed;
    } else if (this.controlType === 1) {
      if (keyIsDown(UP_ARROW)) dy -= this.speed;
      if (keyIsDown(DOWN_ARROW)) dy += this.speed;
      if (keyIsDown(LEFT_ARROW)) dx -= this.speed;
      if (keyIsDown(RIGHT_ARROW)) dx += this.speed;
    } else if (this.controlType === 2) {
      dx = mouseX - this.x;
      dy = mouseY - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        dx = (dx / dist) * this.speed;
        dy = (dy / dist) * this.speed;
      } else {
        dx = dy = 0;
      }
    }

    let nextX = this.x + dx;
    let nextY = this.y + dy;

    let offset = createVector(this.hitboxOffset_x, this.hitboxOffset_y);
    offset.rotate(this.angle - HALF_PI);

    let hitboxX = nextX + offset.x;
    let hitboxY = nextY + offset.y;

    let collided = false;
    for (let wall of walls) {
      if (wall.collidesWith(hitboxX, hitboxY, this.radius)) {
        collided = true;

        // 🚀 Get vector from wall to hitbox center and push out
        let pushVec = createVector(hitboxX - wall.x, hitboxY - wall.y);
        pushVec.setMag(1.5); // Smaller pushback = smoother

        this.x += pushVec.x;
        this.y += pushVec.y;
        break;
      }
    }

    if (!collided) {
      this.x = nextX;
      this.y = nextY;
    }

    this.x = constrain(this.x, this.width / 2, width - this.width / 2);
    this.y = constrain(this.y, this.height / 2, height - this.height / 2);

    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx) + HALF_PI;
    }
  }

  draw() {
    push();
    translate(this.x, this.y);

    if (this.isExploding) {
      tint(255, this.explosionAlpha);
      image(explosionImage, 0, 0, 60, 60);
      this.explosionAlpha -= 5;
      if (this.explosionAlpha <= 0) {
        this.shouldRemove = true;
        if (this === wasdTank) wasdTank = null;
        if (this === arrowTank) arrowTank = null;
        if (this === mouseTank) mouseTank = null;
      }
      pop();
      return;
    }

    rotate(this.angle);

    // ✅ Correct hitbox offset with rotation
    let offset = createVector(this.hitboxOffset_x, this.hitboxOffset_y);
    offset.rotate(-HALF_PI); // because 0 angle is UP

    // Draw tank sprite
    if (this.customImage) {
      image(this.customImage, 0, 0, this.width, this.height);
    } else {
      let sx = this.spriteIndex * (this.width + 1);
      image(
        tankSpriteSheet,
        0,
        0,
        this.width,
        this.height,
        sx,
        0,
        this.width,
        this.height
      );
    }

    pop();
  }
}

class Projectile {
  constructor(x, y, dx, dy, owner) {
    this.x = x;
    this.y = y;
    this.dx = dx * 5;
    this.dy = dy * 5;
    this.radius = 5;
    this.owner = owner;
    this.birthTime = millis();
    this.lifespan = 5000;
    this.hit = false;
    this.alpha = 255;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;

    if (this.x - this.radius <= 0 || this.x + this.radius >= width) {
      this.dx *= -1;
      this.x = constrain(this.x, this.radius, width - this.radius);
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= height) {
      this.dy *= -1;
      this.y = constrain(this.y, this.radius, height - this.radius);
    }

    for (let wall of walls) {
      if (wall.collidesWith(this.x + this.dx, this.y, this.radius))
        this.dx *= -1;
      if (wall.collidesWith(this.x, this.y + this.dy, this.radius))
        this.dy *= -1;
    }

    let age = millis() - this.birthTime;
    this.alpha = map(age, this.lifespan - 1000, this.lifespan, 255, 0, true);
  }

  draw() {
    fill(255, 200, 0, this.alpha);
    noStroke();
    circle(this.x, this.y, this.radius * 2);
  }

  isOffscreen() {
    return millis() - this.birthTime > this.lifespan;
  }
}

class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw() {
    fill(60);
    stroke(100);
    rect(this.x, this.y, this.w, this.h);
  }

  collidesWith(x, y, r = 0) {
    return (
      x + r > this.x &&
      x - r < this.x + this.w &&
      y + r > this.y &&
      y - r < this.y + this.h
    );
  }

  collidesWithRect(x, y, w, h) {
    return (
      x + w / 2 > this.x &&
      x - w / 2 < this.x + this.w &&
      y + h / 2 > this.y &&
      y - h / 2 < this.y + this.h
    );
  }
  collidesWithPolygon(points) {
    for (let p of points) {
      if (
        p.x > this.x &&
        p.x < this.x + this.w &&
        p.y > this.y &&
        p.y < this.y + this.h
      ) {
        return true;
      }
    }
    return false;
  }
}

function keyPressed() {
  if (key === " " && wasdTank && !wasdTank.isExploding) wasdTank.shoot();
  if (keyCode === SHIFT && arrowTank && !arrowTank.isExploding)
    arrowTank.shoot();
}

function mousePressed() {
  if (mouseTank && !mouseTank.isExploding) mouseTank.shoot();
}

function isOverlappingAny(x, y, w, h, objects) {
  for (let obj of objects) {
    if (
      x < obj.x + obj.w &&
      x + w > obj.x &&
      y < obj.y + obj.h &&
      y + h > obj.y
    )
      return true;
  }
  return false;
}

function generateWallsAvoiding(objects) {
  for (let i = 0; i < 10; i++) {
    let tries = 0;
    while (tries < 100) {
      let w, h;
      w = random(10, 40);
      h = random(60, 360);

      let x = random(width - w);
      let y = random(height - h);
      if (!isOverlappingAny(x, y, w, h, objects)) {
        walls.push(new Wall(x, y, w, h));
        break;
      }
      tries++;
    }
  }
}

function spawnTanks() {
  tanks = [];
  let tankSpawns = [];
  let tankSize = 50;
  for (let i = 0; i < 3; i++) {
    let tries = 0;
    while (tries < 100) {
      let x = random(tankSize, width - tankSize);
      let y = random(tankSize, height - tankSize);
      if (
        !isOverlappingAny(
          x - tankSize / 2,
          y - tankSize / 2,
          tankSize,
          tankSize,
          [...walls, ...tankSpawns]
        )
      ) {
        tankSpawns.push({ x, y, w: tankSize, h: tankSize });
        if (i === 0) {
          wasdTank = new Tank(x, y, 0, 0, 2, wasdTankImage);
          wasdTank.playerIndex = 0;
        }
        if (i === 1) {
          arrowTank = new Tank(x, y, 1, 1, 2, arrowTankImage);
          arrowTank.playerIndex = 1;
        }
        if (i === 2) {
          mouseTank = new Tank(x, y, 2, 2, 2, mouseTankImage);
          mouseTank.playerIndex = 2;
        }

        tanks.push([wasdTank, arrowTank, mouseTank][i]);
        break;
      }
      tries++;
    }
  }
}
// Tank Game Full Code (Formatted & Working)
function getWalls() {
  const size = 50;
  const columns = 24;
  const rows = 16;
  const totalCells = columns * rows;

  let coords = new Array(totalCells).fill(1);
  let visited = Array.from({ length: rows }, () => Array(columns).fill(false));

  function index(x, y) {
    return y * columns + x;
  }

  function isInBounds(x, y) {
    return x >= 0 && x < columns && y >= 0 && y < rows;
  }

  function carveMaze(x, y) {
    visited[y][x] = true;
    coords[index(x, y)] = 0;

    let directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];

    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (let [dx, dy] of directions) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;

      if (isInBounds(nx, ny) && !visited[ny][nx]) {
        coords[index(x + dx, y + dy)] = 0;
        carveMaze(nx, ny);
      }
    }
  }

  // Start maze from a random odd cell
  const startX = (Math.floor(Math.random() * (columns / 2)) * 2) | 1;
  const startY = (Math.floor(Math.random() * (rows / 2)) * 2) | 1;
  carveMaze(startX, startY);

  // Add random openings to break up tight corridors
  const randomOpenings = 260; // tweak this for more/less openness
  for (let i = 0; i < randomOpenings; i++) {
    const rx = Math.floor(Math.random() * columns);
    const ry = Math.floor(Math.random() * rows);
    coords[index(rx, ry)] = 0;
  }

  // Final wall object creation
  let walls = [];
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * size;
      let y = j * size;
      if (coords[index(i, j)] === 1) {
        walls.push(new Wall(x, y, size, size));
      }
    }
  }

  return walls;
}

function resetGame() {
  walls = getWalls();
  projectiles = [];
  spawnTanks();
}
