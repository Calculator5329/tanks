class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw() {
    if (
      this.x + this.w < 0 ||
      this.x > width ||
      this.y + this.h < 0 ||
      this.y > height
    ) {
      return;
    }
    optimizedFill(60);
    optimizedStroke(100);
    rect(this.x, this.y, this.w, this.h);
  }

  collidesWith(x, y, r = 0) {
    let closestX = constrain(x, this.x, this.x + this.w);
    let closestY = constrain(y, this.y, this.y + this.h);

    let distX = x - closestX;
    let distY = y - closestY;
    let distanceSq = distX * distX + distY * distY;

    return distanceSq <= r * r;
  }
}
