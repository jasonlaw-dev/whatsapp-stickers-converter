import React from 'react';
import Container from 'react-bootstrap/lib/Container';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Navbar from 'react-bootstrap/lib/Navbar';
import ImageUpload from './ImageUpload';
import UAParser from 'ua-parser-js';

// import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends React.Component {

  isMobile = false;

  isDownloadMultipleFilesSupported = false;

  constructor(props) {
    super(props);
    const result = new UAParser(window.navigator);
    const os = result.getOS();
    const browser = result.getBrowser();
    const osName = os && os.name ? os.name : '';
    const browserName = browser && browser.name ? browser.name : '';
    this.isMobile = osName.startsWith('Android') || osName.startsWith('iOS');
    this.isDownloadMultipleFilesSupported = browserName.startsWith('Chrom');
  }

  render() {
    return (

      <Container style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Row className="justify-content-md-center">
          <Col lg={10}>
            <Navbar bg="light" expand="lg" style={{ marginBottom: '20px' }}>
              <Navbar.Brand>WhatsApp Stickers Converter</Navbar.Brand>
            </Navbar>
          </Col>
        </Row>

        <Row className="justify-content-md-center">
          <Col lg={10}>
            <ImageUpload isMobile={this.isMobile} isDownloadMultipleFilesSupported={this.isDownloadMultipleFilesSupported} />
          </Col>
        </Row>
      </Container>

    );
  }
}

export default App;
