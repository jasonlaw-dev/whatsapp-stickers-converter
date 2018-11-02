/* global libwebp */

// emcc -O3 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s ALLOW_MEMORY_GROWTH=1 -s "BINARYEN_TRAP_MODE='clamp'" -I libwebp webp.c libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c

const jimp = require('jimp');
const JSZip = require('jszip');
// const Module = require('./vendor/a.out');

export let api = {
  isLoaded: false,
};
let Module;

libwebp().then((module) => {
  Module = module;
  api = {
    version: Module.cwrap('version', 'number', []),
    create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
    destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
    encode: Module.cwrap('encode', '', ['number', 'number', 'number', 'number']),
    free_result: Module.cwrap('free_result', '', ['number']),
    get_result_pointer: Module.cwrap('get_result_pointer', 'number', []),
    get_result_size: Module.cwrap('get_result_size', 'number', []),
    isLoaded: true,
  };
  console.log(`libwebp loaded, api version: ${api.version()}`);
});

// using libwebp
function convertImageDataToWebpURL(imageData, quality) {
  const p = api.create_buffer(imageData.width, imageData.height);
  Module.HEAP8.set(imageData.data, p);
  api.encode(p, imageData.width, imageData.height, quality);
  const resultPointer = api.get_result_pointer();
  const resultSize = api.get_result_size();
  const resultView = new Uint8Array(Module.HEAP8.buffer, resultPointer, resultSize);
  const result = new Uint8Array(resultView);
  api.free_result(resultPointer);
  api.destroy_buffer(p);
  return btoa(result.reduce((data, byte) => {
    return data + String.fromCharCode(byte);
  }, ''));
}

function convertURLToWebpURL(url, quality) {
  // eslint-disable-next-line consistent-return
  return new Promise((resolve, reject) => {
    if (url == null) return reject();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const image = new Image();
    image.addEventListener('load', () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const useChrome = false;
      if (useChrome) {
        resolve(canvas.toDataURL('image/webp', quality));
      } else {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        resolve(convertImageDataToWebpURL(imageData, Math.ceil(quality * 100)));
      }
    }, false);
    image.src = url;
  });
}

export function addNumberToURL(URI, text) {
  // eslint-disable-next-line consistent-return
  return new Promise(((resolve, reject) => {
    if (URI == null) return reject();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const image = new Image();
    image.addEventListener('load', () => {
      canvas.width = image.width;
      canvas.height = image.height;

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      context.save();

      // draw circle
      context.beginPath();
      context.arc(canvas.width - 0 - 16, canvas.height - 0 - 16, 16, 0, 2 * Math.PI);
      context.fillStyle = 'rgba(53, 67, 90, 0.85)';
      context.fill();

      context.restore();

      // draw number
      context.font = '30px helvetica';
      context.textAlign = 'center';
      context.fillStyle = '#f7f7f7';
      context.lineWidth = 2;
      context.fillText(`${text}`, canvas.width - 0 - 16, canvas.height - 0 - 6);
      resolve(canvas.toDataURL('image/png'));
    }, false);
    image.src = URI;
  }));
}


async function resizeAndConvert(input, px, toWebp) {
  return jimp.read(input).then((image) => {
    if (toWebp) {
      return image.contain(px, px).getBase64Async(jimp.MIME_PNG)
        .then(uri => convertURLToWebpURL(uri, 1).then(async (_webpUri) => {
          let webpUri = _webpUri;

          let quality = 1.0;
          while (btoa(webpUri).length > 99999 && quality > 0.2) {
            quality -= 0.08;
            console.error(`WebP size ${Math.ceil(btoa(webpUri).length / 1024)}kb exceeded 100kb, resizing with quality ${quality}`);
            // eslint-disable-next-line no-await-in-loop
            webpUri = await convertURLToWebpURL(uri, quality);
          }
          return webpUri;
        }));
    }
    return image.contain(px, px).getBase64Async(jimp.MIME_PNG);
  });
}

export async function loadFile(file, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        if (type === 'tray') {
          resolve(await resizeAndConvert(reader.result, 96, false));
        } else if (type === 'stickers') {
          resolve(await resizeAndConvert(reader.result, 512, true));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function unzip(file) {
  return JSZip.loadAsync(file).then(async (zip) => {
    const imagePaths = [];
    zip.forEach((relativePath) => {
      if (!relativePath.startsWith('__MACOSX') && (relativePath.endsWith('.png') || relativePath.endsWith('.jpg'))) {
        imagePaths.push(relativePath);
      }
    });
    if (imagePaths.length < 3) {
      throw new Error('Less than 3 images are found!');
    }
    return {
      trayFile: await zip.file(imagePaths[0]).async('blob'),
      stickersFiles: await Promise.all(imagePaths.map(path => zip.file(path).async('blob'))),
    };
  })
}

