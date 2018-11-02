/* eslint-disable no-await-in-loop */
import React from 'react';
import Form from 'react-bootstrap/lib/Form';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Button from 'react-bootstrap/lib/Button';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';
import ToggleButtonGroup from 'react-bootstrap/lib/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/lib/ToggleButton';
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Alert from 'react-bootstrap/lib/Alert';
import { loadFile, addNumberToURL, unzip, api } from './FileHandler';

const download = require('downloadjs');

class ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      identifier: '',
      name: '',
      publisher: '',
      trayFile: null,
      stickersFiles: null,
      zipFile: null,
      isSubmitting: false,
      progress: 0,
      errorMsg: '',
      convertedPacks: [],
      uploadType: 'image',
      isApiLoaded: true,
    };
    setTimeout(() => {
      if (!api.isLoaded) {
        this.setState({
          isApiLoaded: false,
        });
      }
    }, 1000);
  }

  handleSubmit = (e) => {
    e.preventDefault();

    this.setState({
      progress: 0,
      errorMsg: '',
      isSubmitting: true,
      convertedPacks: [],
    });

    const {
      identifier, name, publisher, zipFile, uploadType,
    } = this.state;

    let {
      trayFile, stickersFiles,
    } = this.state;

    (async () => {
      if (uploadType === 'zip') {
        const zipContent = await unzip(zipFile);
        // eslint-disable-next-line prefer-destructuring
        trayFile = zipContent.trayFile;
        // eslint-disable-next-line prefer-destructuring
        stickersFiles = zipContent.stickersFiles;
      }


      const tray = await loadFile(trayFile, 'tray');
      const stickersInPack = [];

      const numOfPacks = Math.ceil(stickersFiles.length / 30);
      const trays = [];

      for (let pack = 0; pack < numOfPacks; pack++) {
        stickersInPack.push([]);
        trays.push(numOfPacks === 1 ? tray : await addNumberToURL(tray, `${pack + 1}`));
      }

      for (let i = 0; i < stickersFiles.length; i++) {
        const sticker = await loadFile(stickersFiles[i], 'stickers');
        this.setState({ progress: (i + 1) / stickersFiles.length * 100 });
        stickersInPack[Math.floor(i / 30)].push(sticker);
      }

      if (numOfPacks > 1 && stickersInPack[numOfPacks - 1].length < 3) {
        stickersInPack[numOfPacks - 1] = [
          ...stickersInPack[numOfPacks - 2].splice(-(3 - stickersInPack[numOfPacks - 1].length)),
          ...stickersInPack[numOfPacks - 1],
        ];
      }

      stickersInPack.map((pack, index) => ({
        identifier: identifier + (index === 0 ? '' : `_${index + 1}`),
        name: name + (index === 0 ? '' : ` (${index + 1})`),
        publisher,
        tray_image: trays[index].replace('data:image/png;base64,', ''),
        stickers: pack.map(sticker => ({
          image_data: sticker.replace('data:image/webp;base64,', ''),
        })),
      })).forEach((pack) => {
        this.setState(prevState => ({
          convertedPacks: [...prevState.convertedPacks, pack],
        }));
        if (!this.props.isMobile) {
          this.handleDownload(pack);
        }
      });
      this.setState({ isSubmitting: false });
      window.scrollTo(0, document.body.scrollHeight);
    })().catch((error) => {
      console.error(error);
      this.setState({
        errorMsg: error.message || e.toString(),
        isSubmitting: false,
      });
    });
  };

  handleFileChange = (e, type) => {
    e.preventDefault();

    if (type === 'tray') {
      this.setState({
        trayFile: e.target.files[0],
      });


      // for debugging photo
      // setTimeout(async() => {
      //   const tray = await loadFile(this.state.trayFile, 'tray');
      //   const tray2 = await addNumberToURL(tray, '8');
      //   this.setState({
      //     imagePreviewUrl: tray2,
      //   })
      // }, 500)
    } else if (type === 'stickers') {
      this.setState({
        stickersFiles: e.target.files,
      });
    } else if (type === 'zip') {
      this.setState({
        zipFile: e.target.files[0],
      });
    }
  };

  handleInputChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value,
    });
  };

  handleDownload = (pack) => {
    const jsonString = JSON.stringify(pack);
    if (this.props.isMobile) {
      const url = `twesticker://json?data=${encodeURIComponent(jsonString)}`;
      window.open(url);
    } else {
      const url = `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;
      download(url, `${pack.identifier}.json`, 'application/json');
    }
  }

  isFormValid = () => this.isIdentifierValid() && this.state.identifier && this.state.name && this.state.publisher &&
    ((this.state.uploadType === 'image' && this.state.trayFile != null && this.state.stickersFiles && this.state.stickersFiles.length >= 3) ||
      (this.state.uploadType === 'zip' && this.state.zipFile != null));

  isSubmittable = () => this.isFormValid() && !this.state.isSubmitting;

  isIdentifierValid = () => /^[A-Za-z0-9-_.\s]*$/.test(this.state.identifier);

  render() {
    return (
      <Form onSubmit={e => this.handleSubmit(e)}>
        {
          this.state.isApiLoaded || (
            <Alert variant="danger">
              Critical API not loaded, please refresh.
            </Alert>
          )
        }
        <Form.Group as={Row} controlId="identifier">
          <Form.Label column sm={4}>Identifier</Form.Label>
          <Col sm={6}>
            <Form.Control type="text" required onChange={this.handleInputChange} isInvalid={!this.isIdentifierValid()} />
            <Form.Control.Feedback type="invalid">
              {'Alphanumeric characters with ".", "_", "-" or " " only '}
            </Form.Control.Feedback>
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="name">
          <Form.Label column sm={4}>Pack Name</Form.Label>
          <Col sm={6}>
            <Form.Control type="text" required onChange={this.handleInputChange} />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="publisher">
          <Form.Label column sm={4}>Publisher</Form.Label>
          <Col sm={6}>
            <Form.Control type="text" required onChange={this.handleInputChange} />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId="uploadType">
          <Form.Label column sm={4}>Upload Type</Form.Label>
          <Col sm={8}>
            <ButtonToolbar>
              <ToggleButtonGroup type="radio" name="options" value={this.state.uploadType} onChange={e => this.handleInputChange({ target: { id: 'uploadType', value: e } })}>
                <ToggleButton value="image">Image Files</ToggleButton>
                <ToggleButton value="zip">Zip File</ToggleButton>
              </ToggleButtonGroup>
            </ButtonToolbar>
          </Col>
        </Form.Group>

        {
          this.state.uploadType === 'image' ? (
            <div>
              <Form.Group as={Row} controlId="formTrayFile">
                <Form.Label column sm={4}>Tray Icon</Form.Label>
                <Col sm={8}>
                  <div className="custom-file">
                    <Form.Control
                      className="custom-file-input"
                      type="file"
                      required
                      isValid={false}
                      onChange={e => this.handleFileChange(e, 'tray')}
                      accept="image/png, image/jpeg"
                    />
                    <Form.Label className="custom-file-label">{this.state.trayFile ? this.state.trayFile.name : 'Choose file (any resolution)' }</Form.Label>
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
                      onChange={e => this.handleFileChange(e, 'stickers')}
                      accept="image/png"
                    />
                    <Form.Label className="custom-file-label">{this.state.stickersFiles && this.state.stickersFiles.length > 0 ? `${this.state.stickersFiles.length} file(s) selected` : 'Choose file (any resolution)' }</Form.Label>
                  </div>
                </Col>
              </Form.Group>
            </div>
          ) : (this.state.uploadType === 'zip' ? (
            <Form.Group as={Row} controlId="formZipFile">
              <Form.Label column sm={4}>Zip file</Form.Label>
              <Col sm={8}>
                <div className="custom-file">
                  <Form.Control
                    className="custom-file-input"
                    type="file"
                    required
                    multiple
                    onChange={e => this.handleFileChange(e, 'zip')}
                    accept=".zip"
                  />
                  <Form.Label className="custom-file-label">{this.state.zipFile ? this.state.zipFile.name : 'Choose file' }</Form.Label>
                </div>
              </Col>
            </Form.Group>
          ) : null)
        }

        <Button type="submit" disabled={!this.isSubmittable()}>Convert Images</Button>
        <ProgressBar style={{ transition: 'none', marginTop: '15px' }} now={this.state.progress} hidden={!this.state.isSubmitting && !this.state.errorMsg} variant={this.state.errorMsg ? 'danger' : ''} />
        <p
          className={this.state.errorMsg ? 'text-danger' : 'text-success'}
          hidden={!this.state.errorMsg && this.state.progress !== 100}
        >
          {this.state.errorMsg || 'Images converted!'}
        </p>
        {!this.props.isMobile || this.state.convertedPacks.map((pack, index) => (
          <div style={{ marginTop: '3px', marginBottom: '3px' }}>
            <Button variant="outline-primary" onClick={() => this.handleDownload(pack)}>
              JSON File {index + 1}
            </Button>
          </div>
        ))}
      </Form>
    );
  }
}


export default ImageUpload;
