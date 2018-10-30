import React from 'react';

const jimp = require('jimp');
const download = require('downloadjs')

function convertURIToWebpURI(URI) {
  return new Promise(function(resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image();
    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/webp", 1));
    }, false);
    image.src = URI;
  });
}


async function resizeAndConvert(input, px, toWebp) {
  return jimp.read(input).then(image => {
    if (toWebp) {
      return image.contain(px, px).getBase64Async(jimp.MIME_PNG).then(convertURIToWebpURI);
    }
    return image.contain(px, px).getBase64Async(jimp.MIME_PNG);
  })
}

async function loadFile(file, type) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

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
    }
    reader.readAsArrayBuffer(file);
  }
)
}

class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  _handleSubmit = (e) => {
    e.preventDefault();

    (async () => {
      const tray = await loadFile(this.state.trayFile, 'tray');
      const stickers = [];
      for (let i = 0; i < this.state.stickersFiles.length; i++) {
        stickers.push(await loadFile(this.state.stickersFiles[i], 'stickers'));
      }

      const dataJson = {
        "identifier": this.state.identifier,
        "name": this.state.name,
        "publisher": this.state.publisher,
        "tray_image": tray.replace('data:image/png;base64,', ''),
        "stickers": [
        ]
      }

      dataJson.stickers.push(...stickers.map(sticker => ({
      image_data: sticker.replace('data:image/webp;base64,', '')}
      )));

      download( 'data:application/json;base64,'+ new Buffer(JSON.stringify(dataJson)).toString('base64'), `${this.state.identifier}.json`, 'application/json');

      console.log(JSON.stringify(dataJson));
    })()
  };

  _handleImageChange = (e, type) =>{
    e.preventDefault();


    if (type === 'tray') {
      this.setState({
        trayValue: e.target.value,
        trayFile: e.target.files[0]
      });
    } else if (type === 'stickers') {
      this.setState({
        stickersValue: e.target.value,
        stickersFiles: e.target.files
      });
    }

  }

  _handleInputChange = (e, field) => {
    this.setState({
      [field]: e.target.value
    })
  }

  render() {
    let {imagePreviewUrl} = this.state;
    let $imagePreview = null;
    if (imagePreviewUrl) {
      $imagePreview = (<img src={imagePreviewUrl} />);
    } else {
      $imagePreview = (<div className="previewText">Please select an Image for Preview</div>);
    }

    return (
      <div className="previewComponent">
        <form onSubmit={(e)=>this._handleSubmit(e)}>

          <div>
            <label>
              Identifier:
              <input type="text" onChange={(e)=>this._handleInputChange(e, 'identifier')} />
            </label>
          </div>

          <div>
            <label>
              Pack Name:
              <input type="text" onChange={(e)=>this._handleInputChange(e, 'name')} />
            </label>
          </div>

          <div>
            <label>
              Publisher:
              <input type="text" onChange={(e)=>this._handleInputChange(e, 'publisher')} />
            </label>
          </div>

          <div>
            <label>
              Tray Icon PNG:
              <input type="file" onChange={(e)=>this._handleImageChange(e, 'tray')} />
            </label>
          </div>
          <div>
            <label>
              Stickers PNGs (3 - 30 images):
              <input type="file" multiple onChange={(e)=>this._handleImageChange(e, 'stickers')} />
            </label>
          </div>
          <hr/>
          <button className="submitButton"
                  type="submit"
                  onClick={(e)=>this._handleSubmit(e)}>Convert Images</button>
        </form>
      </div>
    )
  }
}

export default ImageUpload
