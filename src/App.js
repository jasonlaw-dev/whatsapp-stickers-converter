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
  constructor(props) {
    super(props);
    console.log();
  }

  isMobile = () => {
    const os = new UAParser(window.navigator).getOS();
    return os && os.name && (os.name.startsWith('Android') || os.name.startsWith('iOS'));
  };

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
            <ImageUpload isMobile={this.isMobile()} />
          </Col>
        </Row>
      </Container>

    );
  }
}

export default App;
