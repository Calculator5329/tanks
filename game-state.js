let tanks = [];
let projectiles = [];
let walls = [];
let scores = [];
let roundEnded = false;
let topMargin = 25;
let gamePhase = "menu"; // "menu" or "playing"
let playerSelections = [null, null, null]; // stores selected images
let tankImageOptions = []; // all loaded tank images
let powerUps = [];
const powerUpTypes = ["speed", "shield", "rapidFire"];
const powerUpSize = 30;
let wallGrid = new SpatialGrid(100);
let projectileGrid = new SpatialGrid(100);

let wasdTank, arrowTank, mouseTank;

function resetGame() {
  walls = getWalls();
  wallGrid.clear();
  for (let wall of walls) wallGrid.insert(wall);

  wallBuffer.clear(); // Clear the old visuals
  drawWallsOnce(); // Redraw the new walls

  projectiles = [];
  spawnTanks();
  spawnPowerUps();
}
