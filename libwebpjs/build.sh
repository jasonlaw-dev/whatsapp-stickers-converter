#!/bin/sh
if [[ "$(docker images -q trzeci/emscripten:1.39.18-upstream 2> /dev/null)" == "" ]]; then
  docker pull trzeci/emscripten:1.39.18-upstream
fi
docker run --rm -v $(pwd):/libwebpjs trzeci/emscripten:1.39.18-upstream \
  /bin/bash -c "cd /libwebpjs && \
  emcc -O3 \
  -s WASM=1 \
  -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"cwrap\"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s 'EXPORT_NAME=\"libwebp\"' \
  -I libwebp \
  -o libwebpjs.out.js \
  webp.c \
  libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c"
cp libwebpjs.out.* ../public