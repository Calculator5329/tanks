class PowerUp {
  constructor(type, duration = 5000) {
    this.type = type; // e.g. "speed", "shield", "rapidFire", etc.
    this.duration = duration; // in ms
    this.startTime = millis();
  }

  isExpired() {
    return millis() - this.startTime > this.duration;
  }

  applyEffect(tank) {
    switch (this.type) {
      case "speed":
        tank.speed = 5;
        break;
      case "shield":
        tank.shielded = true;
        break;
      case "rapidFire":
        tank.maxProjectiles = 10;
        break;
    }
  }

  removeEffect(tank) {
    switch (this.type) {
      case "speed":
        tank.speed = 2;
        break;
      case "shield":
        tank.shielded = false;
        break;
      case "rapidFire":
        tank.maxProjectiles = tank.defaultMaxProjectiles;
        break;
    }
  }
}
