#include "emscripten.h"
#include "src/webp/encode.h"
#include "src/webp/decode.h"
#include <stdlib.h>

EMSCRIPTEN_KEEPALIVE
int version() {
  return WebPGetEncoderVersion();
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int width, int height) {
  return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer_with_size(int size) {
  return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}

int encodeResult[2];
int decodeResult[3];

EMSCRIPTEN_KEEPALIVE
void encode(uint8_t* img_in, int width, int height, float quality) {
  uint8_t* img_out;
  size_t size;
  size = WebPEncodeRGBA(img_in, width, height, width * 4, quality, &img_out);
  encodeResult[0] = (int)img_out;
  encodeResult[1] = size;
}

EMSCRIPTEN_KEEPALIVE
void decode(const uint8_t* data, size_t size) {
  int width;
  int height;

  uint8_t* buffer = WebPDecodeRGBA(data, size, &width, &height);
  decodeResult[0] = (int)buffer;
  decodeResult[1] = width;
  decodeResult[2] = height;
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t* result) {
  WebPFree(result);
}

EMSCRIPTEN_KEEPALIVE
int get_encode_result_pointer() {
  return encodeResult[0];
}

EMSCRIPTEN_KEEPALIVE
int get_encode_result_size() {
  return encodeResult[1];
}

EMSCRIPTEN_KEEPALIVE
int get_decode_result_pointer() {
  return decodeResult[0];
}

EMSCRIPTEN_KEEPALIVE
int get_decode_result_width() {
  return decodeResult[1];
}

EMSCRIPTEN_KEEPALIVE
int get_decode_result_height() {
  return decodeResult[2];
}
