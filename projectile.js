class Projectile {
  constructor(x, y, dx, dy, owner) {
    this.x = x;
    this.y = y;
    this.dx = dx * 2.5;
    this.dy = dy * 2.5;
    this.radius = 5;
    this.owner = owner;
    this.birthTime = millis();
    this.lifespan = 5000;
    this.hit = false;
    this.alpha = 255;
    let age;
  }

  update() {
    // Predict next position
    let nextX = this.x + this.dx;
    let nextY = this.y + this.dy;

    // Bounce off screen edges
    if (nextX - this.radius <= 0 || nextX + this.radius >= width) {
      this.dx *= -1;
      nextX = constrain(nextX, this.radius, width - this.radius);
    }
    if (nextY - this.radius <= 0 || nextY + this.radius >= height) {
      this.dy *= -1;
      nextY = constrain(nextY, this.radius, height - this.radius);
    }

    // Bounce off walls
    for (let wall of walls) {
      if (wall.collidesWith(nextX, this.y, this.radius)) {
        this.dx *= -1;
        this.dx += random(-0.3, 0.3);
        nextX = this.x + this.dx;
      }
      if (wall.collidesWith(this.x, nextY, this.radius)) {
        this.dy *= -1;
        this.dy += random(-0.3, 0.3);
        nextY = this.y + this.dy;
      }
    }

    // Apply new position
    this.x = nextX;
    this.y = nextY;

    this.age = millis() - this.birthTime;
    this.alpha = map(
      this.age,
      this.lifespan - 1000,
      this.lifespan,
      255,
      0,
      true
    );
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
