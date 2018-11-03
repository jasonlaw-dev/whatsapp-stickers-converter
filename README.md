# WhatsApp Stickers Converter

### How to build libwebpjs
Clone libwebp project
```
git clone https://github.com/webmproject/libwebp.git libwebpjs/libwebp
cd libwebpjs
```

Build and move output files to public
```
emcc -O3 \
 -s WASM=1 \
 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' \
 -s ALLOW_MEMORY_GROWTH=1 \
 -s "BINARYEN_TRAP_MODE='clamp'" \
 -s MODULARIZE=1 \
 -s 'EXPORT_NAME="libwebp"' \
 -I libwebp \
 -o libwebpjs.out.js \
 webp.c \
 libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c
 
mv *.out.* ../public
```

##
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.
