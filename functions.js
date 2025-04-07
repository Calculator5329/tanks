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

  const startX = (Math.floor(Math.random() * (columns / 2)) * 2) | 1;
  const startY = (Math.floor(Math.random() * (rows / 2)) * 2) | 1;
  carveMaze(startX, startY);

  const extraCorridors = 360;
  for (let i = 0; i < extraCorridors; i++) {
    // Pick a random already open cell
    let tries = 0;
    let cx, cy;
    do {
      cx = Math.floor(Math.random() * columns);
      cy = Math.floor(Math.random() * rows);
      tries++;
    } while (coords[index(cx, cy)] !== 0 && tries < 50);

    if (tries >= 50) continue;

    // Extend from it in a random direction
    const [dx, dy] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][Math.floor(Math.random() * 4)];

    const nx = cx + dx;
    const ny = cy + dy;

    if (isInBounds(nx, ny)) {
      coords[index(nx, ny)] = 0;
    }
  }

  const extraWalls = 25;
  for (let i = 0; i < extraWalls; i++) {
    // Pick a random open cell
    let tries = 0;
    let cx, cy;
    do {
      cx = Math.floor(Math.random() * columns);
      cy = Math.floor(Math.random() * rows);
      tries++;
    } while (coords[index(cx, cy)] !== 0 && tries < 50);

    if (tries >= 50) continue;

    // Pick a direction and place a wall next to it
    const [dx, dy] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][Math.floor(Math.random() * 4)];

    const nx = cx + dx;
    const ny = cy + dy;

    if (isInBounds(nx, ny)) {
      coords[index(nx, ny)] = 1;
    }
  }

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

  console.log(walls.length);

  return walls;
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
        let tank = new Tank(
          x,
          y,
          i,
          i,
          2,
          [wasdTankImage, arrowTankImage, mouseTankImage][i]
        );
        tank.playerIndex = i;
        tanks.push(tank);
        if (i === 0) wasdTank = tank;
        if (i === 1) arrowTank = tank;
        if (i === 2) mouseTank = tank;
        if ((tank = mouseTank)) tank.speed = 1.5;
        break;
      }
      tries++;
    }
  }
}

function drawWalls() {
  for (let wall of walls) wall.draw();
}

function updateTanks() {
  for (let tank of tanks) {
    tank.update();
    tank.draw();
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.update();
    p.draw();
    if (p.isOffscreen()) projectiles.splice(i, 1);
  }
}

function checkCollisions() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    // Iterate backwards when removing items
    let proj = projectiles[i];
    let projectileHit = false; // Flag to track if this projectile hit something

    for (let j = tanks.length - 1; j >= 0; j--) {
      // Iterate backwards if tanks can be removed
      let tank = tanks[j];

      // Skip check if tank is already exploding or has no health
      if (tank.isExploding || tank.health <= 0) {
        continue;
      }

      // Conditions for a valid hit:
      // 1. Target tank is not the projectile owner OR
      // 2. Target tank IS the owner, but projectile is old enough (prevent self-hit on spawn)
      let canHit =
        tank !== proj.owner || (tank === proj.owner && proj.age > 240);

      if (canHit) {
        // --- Use getHitboxCenter() for collision ---
        let hitboxPos = tank.getHitboxCenter();
        let distanceSq =
          (proj.x - hitboxPos.x) * (proj.x - hitboxPos.x) +
          (proj.y - hitboxPos.y) * (proj.y - hitboxPos.y);
        let radiiSq =
          (tank.hitboxRadius + proj.radius) * (tank.hitboxRadius + proj.radius);

        if (distanceSq < radiiSq) {
          // Collision detected
          tank.explode(); // Trigger tank explosion sequence
          proj.hit = true; // Mark projectile for removal
          projectileHit = true;

          // Award score if it wasn't a self-hit and the owner is valid
          if (
            proj.owner &&
            tank !== proj.owner &&
            typeof proj.owner.playerIndex === "number"
          ) {
            // Check if owner still exists and is alive (might have exploded simultaneously)
            if (proj.owner.health > 0 && !proj.owner.isExploding) {
              scores[proj.owner.playerIndex]++;
            }
          }
          // Since tank exploded, no need to check other projectiles against it in this frame?
          // Optional: break inner loop if you assume one hit per frame destroys tank
          // break;
        }
      }
    } // End tanks loop

    // Remove projectile if it hit something or is offscreen
    if (projectileHit || proj.isOffscreen()) {
      projectiles.splice(i, 1);
    }
  } // End projectiles loop

  // Filter out tanks marked for removal (after explosion animation)
  // This filtering happens AFTER collision checks for the frame are done
  tanks = tanks.filter((tank) => !tank.shouldRemove);
}

function handleRoundEnd() {
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
}

function drawFPS() {
  fill(255);
  textSize(14);
  text("FPS: " + nf(frameRate(), 2, 1), 100, height - 20);
}

function drawLeaderboard() {
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP);
  for (let i = 0; i < scores.length; i++) {
    let label =
      (i === 0 ? "WASD" : i === 1 ? "ARROWS" : "MOUSE") + ": " + scores[i];
    text(label, width - 10, 10 + i * 20);
  }
}
function spawnPowerUps() {
  powerUps = [];

  let tempBoxes = [...walls, ...tanks];

  for (let i = 0; i < 5; i++) {
    let tries = 0;
    while (tries < 100) {
      let x = random(powerUpSize, width - powerUpSize);
      let y = random(powerUpSize, height - powerUpSize);

      let testBox = {
        x: x - powerUpSize / 2,
        y: y - powerUpSize / 2,
        w: powerUpSize,
        h: powerUpSize,
      };

      if (
        !isOverlappingAny(testBox.x, testBox.y, testBox.w, testBox.h, tempBoxes)
      ) {
        let type = random(powerUpTypes);
        let p = {
          x,
          y,
          w: powerUpSize,
          h: powerUpSize,
          type,
        };
        powerUps.push(p);
        tempBoxes.push(p); // Add this power-up to future overlap checks
        break;
      }
      tries++;
    }
  }
}
function drawPowerUps() {
  push(); // Save drawing state
  rectMode(CENTER);
  for (let p of powerUps) {
    text_ = "";
    switch (p.type) {
      case "speed":
        fill(0, 255, 0);
        text_ = "ZOOM";
        break;
      case "shield":
        fill(0, 200, 255);
        text_ = "SHIELD";
        break;
      case "rapidFire":
        fill(255, 180, 0);
        text_ = "RAPID";
        break;
    }
    rect(p.x, p.y, p.w, p.h);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(text_, p.x, p.y);
  }
  pop();
}
