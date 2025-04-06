let tankSpriteSheet, explosionImage;
let wasdTankImage, arrowTankImage, mouseTankImage;

function preload() {
  explosionImage = loadImage("explode.png");

  for (let i = 0; i < 21; i++) {
    tankImageOptions.push(loadImage(`tank-skins/skin${i}.png`));
  }

  tankSpriteSheet = loadImage("tsprites.png");
  explosionImage = loadImage("explode.png");
}
