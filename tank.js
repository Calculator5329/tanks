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
    this.customImage = customImage;

    this.powerUps = [];
    this.speedMultiplier = 1;
    this.shielded = false;

    this.spriteWidth = 40;
    this.spriteHeight = 68;

    this.hitboxOffsetX = -8;
    this.hitboxOffsetY = 0;
    this.hitboxRadius = 15;

    this.speed = 2 * this.speedMultiplier;
    this.rotationSpeed = 0.05;
    this.maxProjectiles = maxProjectiles;
    this.health = 1;

    this.isExploding = false;
    this.explosionStartTime = 0;
    this.explosionDuration = 500;
    this.shouldRemove = false;

    this.playerIndex = -1;
  }

  getHitboxCenterAt(posX, posY, angle) {
    let offset = createVector(this.hitboxOffsetX, this.hitboxOffsetY);
    offset.rotate(angle - HALF_PI);
    return {
      x: posX + offset.x,
      y: posY + offset.y,
    };
  }

  getHitboxCenter() {
    return this.getHitboxCenterAt(this.x, this.y, this.angle);
  }

  shoot() {
    if (this.health <= 0 || this.isExploding) return;

    const activeBullets = projectiles.filter((p) => p.owner === this);
    if (activeBullets.length >= this.maxProjectiles) return;

    let dx_proj = Math.cos(this.angle - HALF_PI);
    let dy_proj = Math.sin(this.angle - HALF_PI);
    const barrelLength = this.spriteHeight * 0.4;
    let spawnX = this.x + dx_proj * barrelLength;
    let spawnY = this.y + dy_proj * barrelLength;

    const projectileRadius = 5;
    let blockedByWall = false;
    for (let wall of walls) {
      if (wall.collidesWith(spawnX, spawnY, projectileRadius)) {
        blockedByWall = true;
        break;
      }
    }

    if (!blockedByWall) {
      projectiles.push(new Projectile(spawnX, spawnY, dx_proj, dy_proj, this));
    }
  }

  update() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (p.isExpired()) {
        p.removeEffect(this);
        this.powerUps.splice(i, 1);
      } else {
        p.applyEffect(this); // Optional: could skip re-applying every frame if effect is persistent
      }
    }

    if (this.isExploding) {
      let elapsed = millis() - this.explosionStartTime;
      if (elapsed >= this.explosionDuration) {
        this.shouldRemove = true;
        if (this === wasdTank) wasdTank = null;
        if (this === arrowTank) arrowTank = null;
        if (this === mouseTank) mouseTank = null;
      }
      return;
    }
    if (this.health <= 0) return;

    let originalAngle = this.angle;
    let moveIntentX = 0;
    let moveIntentY = 0;
    let rotationIntent = 0;

    if (this.controlType === 0) {
      if (keyIsDown(87)) {
        moveIntentX += Math.cos(this.angle - HALF_PI) * this.speed;
        moveIntentY += Math.sin(this.angle - HALF_PI) * this.speed;
      }
      if (keyIsDown(83)) {
        moveIntentX -= Math.cos(this.angle - HALF_PI) * this.speed;
        moveIntentY -= Math.sin(this.angle - HALF_PI) * this.speed;
      }
      if (keyIsDown(65)) rotationIntent = -this.rotationSpeed;
      if (keyIsDown(68)) rotationIntent = this.rotationSpeed;
    } else if (this.controlType === 1) {
      if (keyIsDown(UP_ARROW)) {
        moveIntentX += Math.cos(this.angle - HALF_PI) * this.speed;
        moveIntentY += Math.sin(this.angle - HALF_PI) * this.speed;
      }
      if (keyIsDown(DOWN_ARROW)) {
        moveIntentX -= Math.cos(this.angle - HALF_PI) * this.speed;
        moveIntentY -= Math.sin(this.angle - HALF_PI) * this.speed;
      }
      if (keyIsDown(LEFT_ARROW)) rotationIntent = -this.rotationSpeed;
      if (keyIsDown(RIGHT_ARROW)) rotationIntent = this.rotationSpeed;
    } else if (this.controlType === 2) {
      let dx_mouse = mouseX - this.x;
      let dy_mouse = mouseY - this.y;
      let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

      let targetAngle = Math.atan2(dy_mouse, dx_mouse) + HALF_PI;
      let angleDiff = targetAngle - this.angle;
      while (angleDiff < -PI) angleDiff += TWO_PI;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      rotationIntent = angleDiff * 0.1;

      if (dist_mouse > this.hitboxRadius) {
        let norm_dx = dx_mouse / dist_mouse;
        let norm_dy = dy_mouse / dist_mouse;
        moveIntentX = norm_dx * this.speed;
        moveIntentY = norm_dy * this.speed;
      }
    }

    let potentialAngle = originalAngle + rotationIntent;
    let rotatedHitboxPos = this.getHitboxCenterAt(
      this.x,
      this.y,
      potentialAngle
    );
    let rotationBlocked = false;

    for (let wall of walls) {
      if (
        wall.collidesWith(
          rotatedHitboxPos.x,
          rotatedHitboxPos.y,
          this.hitboxRadius
        )
      ) {
        rotationBlocked = true;
        break;
      }
    }

    if (!rotationBlocked) {
      this.angle = potentialAngle;
    }
    this.angle = (this.angle + TWO_PI) % TWO_PI;

    let nextVisualX = this.x + moveIntentX;
    let nextVisualY = this.y + moveIntentY;

    let hitboxPosForXCheck = this.getHitboxCenterAt(
      nextVisualX,
      this.y,
      this.angle
    );

    let collidedX = false;
    for (let wall of walls) {
      if (
        wall.collidesWith(
          hitboxPosForXCheck.x,
          hitboxPosForXCheck.y,
          this.hitboxRadius
        )
      ) {
        collidedX = true;
        break;
      }
    }
    if (!collidedX) {
      this.x = nextVisualX;
    }

    let hitboxPosForYCheck = this.getHitboxCenterAt(
      this.x,
      nextVisualY,
      this.angle
    );

    let collidedY = false;
    for (let wall of walls) {
      if (
        wall.collidesWith(
          hitboxPosForYCheck.x,
          hitboxPosForYCheck.y,
          this.hitboxRadius
        )
      ) {
        collidedY = true;
        break;
      }
    }
    if (!collidedY) {
      this.y = nextVisualY;
    }

    let margin = -25;
    let constrainedX = constrain(
      this.x,
      this.spriteWidth / 2 + margin,
      width - this.spriteWidth / 2 - margin
    );
    let constrainedY = constrain(
      this.y,
      this.spriteHeight / 2 + margin,
      height - this.spriteHeight / 2 - margin
    );

    this.x = constrainedX;
    this.y = constrainedY;

    for (let i = powerUps.length - 1; i >= 0; i--) {
      let p = powerUps[i];
      let hitbox = this.getHitboxCenter();
      let distSq = (hitbox.x - p.x) ** 2 + (hitbox.y - p.y) ** 2;
      if (distSq < (this.hitboxRadius + powerUpSize / 2) ** 2) {
        this.addPowerUp(new PowerUp(p.type));
        powerUps.splice(i, 1);
      }
    }
  }

  draw() {
    push();
    translate(this.x, this.y);

    if (this.isExploding) {
      let elapsed = millis() - this.explosionStartTime;
      let alpha = map(elapsed, 0, this.explosionDuration, 255, 0, true);
      tint(255, alpha);
      imageMode(CENTER);
      image(
        explosionImage,
        0,
        0,
        this.spriteWidth * 1.5,
        this.spriteWidth * 1.5
      );
      pop();
      return;
    }

    rotate(this.angle);
    imageMode(CENTER);

    let imgToDraw = this.customImage;
    if (!imgToDraw && tankSpriteSheet) {
      let spriteSheetWidthPerTank = 40;
      let spriteSheetHeight = 68;
      let sx = this.spriteIndex * spriteSheetWidthPerTank;
      let sy = 0;
      image(
        tankSpriteSheet,
        0,
        0,
        this.spriteWidth,
        this.spriteHeight,
        sx,
        sy,
        spriteSheetWidthPerTank,
        spriteSheetHeight
      );
    } else if (imgToDraw) {
      image(imgToDraw, 0, 0, this.spriteWidth, this.spriteHeight);
    } else {
      fill(200, 50, 50);
      noStroke();
      rectMode(CENTER);
      rect(0, 0, this.spriteWidth, this.spriteHeight);
      stroke(255);
      strokeWeight(2);
      line(0, -5, 0, -this.spriteHeight * 0.4);
    }

    pop();

    let hitboxPos = this.getHitboxCenter();
    push();
    noFill();
    stroke(255, 255, 255, 40);
    strokeWeight(2);
    if (this.shielded) fill(0, 120, 220, 100) && stroke(255, 255, 255);
    circle(hitboxPos.x, hitboxPos.y, this.hitboxRadius * 2);
    pop();
  }

  explode() {
    if (!this.isExploding && !this.shielded) {
      this.health = 0;
      this.isExploding = true;
      this.explosionStartTime = millis();
    }
  }

  addPowerUp(powerUp) {
    powerUp.applyEffect(this);
    this.powerUps.push(powerUp);
  }
}
