import { ASSET_PATHS } from "./constants";

export class AssetLoader {
  constructor() {
    this.images = {};
    Object.keys(ASSET_PATHS).forEach((key) => {
      this.images[key] = new Image();
    });
  }

  loadAll(onProgress) {
    const entries = Object.entries(ASSET_PATHS);
    const total = entries.length;
    let loaded = 0;

    const update = () => {
      loaded++;
      if (onProgress) {
        onProgress(Math.floor((loaded / total) * 100));
      }
    };

    const promises = entries.map(([key, src]) => {
      return new Promise((resolve) => {
        const img = this.images[key];

        img.onload = () => {
          update();
          resolve(img);
        };

        img.onerror = () => {
          update();
          resolve(null);
        };

        img.src = src;
      });
    });

    return Promise.all(promises).then(() => this.images);
  }

  get(key) {
    return this.images[key];
  }
}

export const assetLoader = new AssetLoader();
