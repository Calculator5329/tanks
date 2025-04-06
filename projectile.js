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

    let predictedX = this.x + this.dx;
    let predictedY = this.y + this.dy;
    let bounced = false;

    for (let wall of walls) {
      if (!bounced && wall.collidesWith(predictedX, this.y, this.radius)) {
        this.dx *= -1;
        predictedX = this.x + this.dx;
        bounced = true;
      }
      if (wall.collidesWith(this.x, predictedY, this.radius)) {
        this.dy *= -1;
        predictedY = this.y + this.dy;
      }
    }

    this.x += this.dx;
    this.y += this.dy;

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
