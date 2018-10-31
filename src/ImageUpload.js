import React from 'react';
import Form from 'react-bootstrap/lib/Form';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';

const jimp = require('jimp');
const download = require('downloadjs');

function convertURIToWebpURI(URI, quality) {
  return new Promise(function(resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image();
    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/webp", quality));
    }, false);
    image.src = URI;
  });
}

function addTextToUri(URI, text) {
  return new Promise(function(resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      image = new Image();
    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      context.save();

      context.beginPath();
      context.arc(canvas.width - 0 - 16, canvas.height - 0 - 16, 16, 0, 2 * Math.PI);
      // context.fillStyle = 'rgba(63,127,191,0.6)';
      context.fillStyle = 'rgba(53, 67, 90, 0.85)';
      context.fill();

      context.restore();

      context.font = '30px helvetica';
      context.textAlign = 'center';
      // context.fillStyle = '#262626';
      context.fillStyle = '#f7f7f7';
      context.lineWidth = 2;
      context.fillText(text, canvas.width - 0 - 16, canvas.height - 0 - 6);
      resolve(canvas.toDataURL("image/png"));
    }, false);
    image.src = URI;
  });
}


async function resizeAndConvert(input, px, toWebp) {
  return jimp.read(input).then(image => {
    if (toWebp) {
      return image.contain(px, px).getBase64Async(jimp.MIME_PNG)
        .then(uri => convertURIToWebpURI(uri, 1).then(async (_webpUri) => {
          let webpUri = _webpUri;

          let quality = 1.0;
          while (btoa(webpUri).length > 99999 && quality > 0.2) {
            quality -= 0.08;
            console.error(`WebP size ${Math.ceil(btoa(webpUri).length / 1024)}kb exceeded 100kb, resizing with quality ${quality}`);
            webpUri = await convertURIToWebpURI(uri, quality);
          }
          return webpUri;
        }))
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
    };
    reader.readAsArrayBuffer(file);
  }
)
}

class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      identifier: '',
      name: '',
      publisher: '',
      trayFile: null,
      stickersFiles: null,
      isSubmitting: false,
      progress: 0,
      errorMsg: '',
    };
  }

  _handleSubmit = (e) => {
    e.preventDefault();

    this.setState({
      progress: 0,
      errorMsg: '',
      isSubmitting: true,
    });

    (async () => {


      const tray = await loadFile(this.state.trayFile, 'tray');
      const stickersInPack = [];

      const numOfPacks = Math.ceil(this.state.stickersFiles.length / 30);
      const trays = [];

      for (let pack = 0; pack < numOfPacks; pack++) {
        stickersInPack.push([]);
        trays.push(numOfPacks === 1 ? tray : await addTextToUri(tray, (pack + 1) + ''));
      }

      for (let i = 0; i < this.state.stickersFiles.length; i++) {
        const sticker = await loadFile(this.state.stickersFiles[i], 'stickers');
        this.setState({ progress: (i + 1) / this.state.stickersFiles.length * 100 });
        stickersInPack[Math.floor(i / 30)].push(sticker);
      }

      if (numOfPacks > 1 && stickersInPack[numOfPacks - 1].length < 3) {
        stickersInPack[numOfPacks - 1] = [
          ...stickersInPack[numOfPacks - 2].splice(-(3 - stickersInPack[numOfPacks - 1].length)),
          ...stickersInPack[numOfPacks - 1],
        ];
      }

      stickersInPack.map((pack, index) => {
        return {
          'identifier': this.state.identifier + (index === 0 ? '' : '_' + (index + 1)),
          'name': this.state.name + (index === 0 ? '' : ' (' + (index + 1) + ')'),
          'publisher': this.state.publisher,
          'tray_image': trays[index].replace('data:image/png;base64,', ''),
          'stickers': pack.map(sticker => {
            return {
              image_data: sticker.replace('data:image/webp;base64,', ''),
            }
          }),
        };
      }).forEach(pack => {
        download('data:application/json;base64,' + new Buffer(JSON.stringify(pack)).toString('base64'), `${pack.identifier}.json`, 'application/json')
        this.setState({ isSubmitting: false });
      });

    })().catch((e) => {
      console.error(e);
      this.setState({
        errorMsg: e.message || e.toString(),
        isSubmitting: false,
      });
    });
  };

  _handleImageChange = (e, type) =>{
    e.preventDefault();

    if (type === 'tray') {
      this.setState({
        trayFile: e.target.files[0]
      });


      // for debugging photo
      setTimeout(async() => {
        const tray = await loadFile(this.state.trayFile, 'tray');
        const tray2 = await addTextToUri(tray, '8');
        this.setState({
          imagePreviewUrl: tray2,
        })
      }, 500)

    } else if (type === 'stickers') {
      this.setState({
        stickersFiles: e.target.files
      });
    }

  };

  _handleInputChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value,
    });
  };

  isFormValid = () => {
    return this.state.identifier && this.state.name && this.state.publisher && this.state.trayFile != null && this.state.stickersFiles && this.state.stickersFiles.length >= 3;
  };

  isSubmittable = () => {
    return this.isFormValid() && !this.state.isSubmitting;
  }

  render() {
    return (
        <Form onSubmit={(e)=>this._handleSubmit(e)}>
          <Form.Group as={Row} controlId="identifier">
            <Form.Label column sm={4}>Identifier</Form.Label>
            <Col sm={6}>
              <Form.Control type="text" required onChange={this._handleInputChange} isInvalid={!/^[A-Za-z0-9-_.\s]*$/.test(this.state.identifier)} />
              <Form.Control.Feedback type="invalid">
                {'Alphanumeric characters with ".", "_", "-" or " " only '}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="name">
            <Form.Label column sm={4}>Pack Name</Form.Label>
            <Col sm={6}>
              <Form.Control type="text" required onChange={this._handleInputChange} />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="publisher">
            <Form.Label column sm={4}>Publisher</Form.Label>
            <Col sm={6}>
              <Form.Control type="text" required onChange={this._handleInputChange} />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="formTrayFile">
            <Form.Label column sm={4}>Tray Icon</Form.Label>
            <Col sm={8}>
              <div className="custom-file">
                <Form.Control
                  className="custom-file-input"
                  type="file"
                  required
                  isValid={false}
                  onChange={(e)=>this._handleImageChange(e, 'tray')}
                  accept="image/png"
                />
                <Form.Label className="custom-file-label">{this.state.trayFile ? this.state.trayFile.name : 'Choose file (PNG, any resolution)' }</Form.Label>
              </div>
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId="formStickersFiles">
            <Form.Label column sm={4}>Stickers (3 or more images)</Form.Label>
            <Col sm={8}>
              <div className="custom-file">
                <Form.Control
                  className="custom-file-input"
                  type="file"
                  required
                  multiple
                  onChange={(e)=>this._handleImageChange(e, 'stickers')}
                  accept="image/png"
                />
                <Form.Label className="custom-file-label">{this.state.stickersFiles && this.state.stickersFiles.length > 0 ? `${this.state.stickersFiles.length} file(s) selected` : 'Choose file (PNG, any resolution)' }</Form.Label>
              </div>
            </Col>
          </Form.Group>
          <Button type="submit" disabled={!this.isSubmittable()}>Convert Images</Button>
          <ProgressBar style={{transition: 'none'}} now={this.state.progress} hidden={!this.state.isSubmitting && !this.state.errorMsg} variant={this.state.errorMsg ? 'danger' : ''} style={{marginTop: '15px'}} />
          <p
            className={this.state.errorMsg ? "text-danger" : "text-success"}
            hidden={!this.state.errorMsg && this.state.progress !== 100}>{this.state.errorMsg || 'Images converted!'}</p>
          <img src={this.state.imagePreviewUrl || ''} />
        </Form>
    )
  }
}


export default ImageUpload
