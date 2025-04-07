let playerSelecting = 0;
let tankButtons = [];

function setup() {
  createCanvas(1200, 800);
  imageMode(CENTER);
  if (gamePhase === "menu") {
    createTankSelectionUI();
  }
}

function draw() {
  if (gamePhase !== "playing") return;

  background(100);
  drawWalls();
  updateTanks();
  updateProjectiles();
  checkCollisions();
  handleRoundEnd();
  drawFPS();
  drawLeaderboard();
  drawPowerUps();
}

function keyPressed() {
  if (key === " " && wasdTank && !wasdTank.isExploding) wasdTank.shoot();
  if (keyCode === ENTER && arrowTank && !arrowTank.isExploding)
    arrowTank.shoot();
}

function mousePressed() {
  if (mouseTank && !mouseTank.isExploding) mouseTank.shoot();
}

function startGameWithSelections() {
  gamePhase = "playing";
  wasdTankImage = playerSelections[0];
  arrowTankImage = playerSelections[1];
  mouseTankImage = playerSelections[2];

  walls = getWalls();
  scores = [0, 0, 0];
  spawnTanks();
  spawnPowerUps();
}

function createTankSelectionUI() {
  // Create a div that overlays the canvas
  const menuContainer = createDiv();
  menuContainer.id("menuContainer");
  menuContainer.style("position", "absolute");
  menuContainer.style("top", "50%");
  menuContainer.style("left", "50%");
  menuContainer.style("transform", "translate(-50%, -50%)");
  menuContainer.style("display", "flex");
  menuContainer.style("flex-direction", "column");
  menuContainer.style("align-items", "center");
  menuContainer.style("background", "#333");
  menuContainer.style("padding", "20px");
  menuContainer.style("border", "2px solid white");
  menuContainer.style("border-radius", "10px");
  menuContainer.style("z-index", "10");

  const instructions = createP(`
    <strong>Controls:</strong><br><br>
    <u>Player 1 (WASD):</u>
    Move with W/A/S/D
    and shoot with Spacebar.<br><br>
  
    <u>Player 2 (Arrows):</u>
    Move with Arrow Keys
    and shoot with Enter.<br><br>
  
    <u>Player 3 (Mouse):</u>
    Move the mouse to aim
    Click to shoot.<br><br>
  
    Pick your tank to start!
  `);
  instructions.style("color", "#fff");
  instructions.style("margin-bottom", "20px");
  instructions.style("text-align", "center");
  instructions.parent(menuContainer);

  const info = createP("Player 1: Pick Your Tank");

  info.id("selectionText");
  info.style("color", "#fff");
  info.parent(menuContainer);

  const grid = createDiv();
  grid.style("display", "grid");
  grid.style("grid-template-columns", "repeat(auto-fit, minmax(80px, 1fr))");
  grid.style("grid-template-rows", "repeat(2, auto)");
  grid.style("gap", "15px");
  grid.style("max-width", "650px");

  grid.parent(menuContainer);

  for (let i = 0; i < tankImageOptions.length; i++) {
    let btn = createImg(`tank-skins/skin${i}.png`, "");
    btn.style("margin", "10px");
    btn.style("border", "2px solid #888");
    btn.style("border-radius", "8px");
    btn.style("transition", "all 0.2s ease");
    btn.style("cursor", "pointer");

    btn.mouseOver(() => {
      btn.style("border-color", "#fff");
      btn.style("box-shadow", "0 0 10px #fff");
    });

    btn.mouseOut(() => {
      btn.style("border-color", "#888");
      btn.style("box-shadow", "none");
    });

    btn.parent(grid);

    btn.mousePressed(() => {
      playerSelections[playerSelecting] = tankImageOptions[i];

      if (playerSelecting < 2) {
        playerSelecting++;
        select("#selectionText").html(
          `Player ${playerSelecting + 1}: Pick Your Tank`
        );
      } else {
        select("#menuContainer").remove();
        startGameWithSelections();
      }
    });

    tankButtons.push(btn);
  }
}
