// Jest stub for pixi.js — its CJS bundle pulls in ESM-only dependencies
// (earcut) that Jest cannot load under jsdom. Tests never exercise the
// renderer, so a structural stub is sufficient.
export class Application {
  stage = {};

  init() {
    return Promise.resolve(this);
  }
}

export class Container {
  children: unknown[] = [];

  alpha = 1;

  mask: unknown = null;

  addChild(...children: unknown[]) {
    this.children.push(...children);
  }

  position = { set: () => {} };

  scale = { set: () => {} };

  destroy() {}
}

export class Graphics {
  blendMode = 'normal';

  clear() {
    return this;
  }

  rect() {
    return this;
  }

  circle() {
    return this;
  }

  ellipse() {
    return this;
  }

  poly() {
    return this;
  }

  fill() {
    return this;
  }

  stroke() {
    return this;
  }

  position = { set: () => {} };
}

export class Rectangle {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}
}

export class Sprite {
  texture: unknown;

  position = { set: () => {}, copyFrom: () => {} };

  visible = false;

  width = 0;

  height = 0;

  alpha = 1;

  blendMode = 'normal';

  anchor = { set: () => {} };

  constructor(texture?: unknown) {
    this.texture = texture;
  }

  destroy() {}
}

export class TilingSprite extends Sprite {
  tilePosition = { x: 0, y: 0 };
}

export const Assets = {
  load: () => Promise.resolve(),
  get: () => new Texture(),
};

export class Texture {
  static EMPTY = new Texture();

  static from() {
    return new Texture();
  }

  source = { scaleMode: '' };

  constructor(public options?: unknown) {}
}
