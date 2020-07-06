# WhatsApp Stickers Converter
https://jasonlaw-dev.github.io/whatsapp-stickers-converter/

## Background
When support for [WhatsApp Stickers](https://faq.whatsapp.com/general/how-to-create-stickers-for-whatsapp) was first released in 2018, I was obssessed with transforming my Telegram stickers to WhatsApp onstickerses. 

Initially, I wrote a simple bash script that transforms stickers into the required webp format. The script was not not user friendly to end users at all so I decided to write a web based converter instead.

The converter was alright, but I didn't stop there. I joined a team of developers to develop a WhatsApp Stickers sharing platform [Sticker.ooo](https://github.com/hkaden/Sticker.ooo). The project failed because of intense competitions, and our intitial prototype wasn't developed fast enough to capture the market share. Nonetheless, it had been one hell of a ride.

This project was developed in haste - mind the code quality :rofl:

## How to use?
The webpage should be pretty much self-explanatory. The exported json file can be imported into WhatsApp using [WTStick](https://apps.apple.com/hk/app/wstick/id1442273161). Before WTStick (which I have no affilation to) was released, we used a custom built iOS app to import the json files.

## To run locally
You need Docker installed to build the binary for libwebp.
```sh
cd libwebpjs && chmod u+x build.sh && ./build.sh && cd ..
npm start
```

## Why libwebp?
I went through the troubles of figuring out the correct build for libwebp because only Chrome had native support on webp images (Safari had no support).

I ended up using emscripten to compile the library into a .wasm file so that the converter can be run by all major browsers on desktop and mobile. Before that, I had no idea I could run C++ code on browsers!