import { ASSET_PATHS } from "./constants";

export class AssetLoader {
  constructor() {
    this.images = {};
  }

  loadAll() {
    Object.entries(ASSET_PATHS).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    });
    return this.images;
  }

  get(key) {
    return this.images[key];
  }
}

export const assetLoader = new AssetLoader();
