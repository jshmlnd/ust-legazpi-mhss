const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.75;

export function compressImage(dataUrl, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function compressImages(dataUrls, opts) {
  return Promise.all(dataUrls.map((d) => compressImage(d, opts?.maxWidth, opts?.maxHeight, opts?.quality)));
}
