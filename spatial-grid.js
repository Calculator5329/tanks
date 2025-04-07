class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  _key(x, y) {
    return `${Math.floor(x / this.cellSize)}_${Math.floor(y / this.cellSize)}`;
  }

  insert(obj) {
    const key = this._key(obj.x, obj.y);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(obj);
  }

  queryRadius(x, y, radius) {
    const results = [];
    const r = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const key = `${cx + dx}_${cy + dy}`;
        if (this.grid.has(key)) {
          results.push(...this.grid.get(key));
        }
      }
    }
    return results;
  }

  clear() {
    this.grid.clear();
  }
}
