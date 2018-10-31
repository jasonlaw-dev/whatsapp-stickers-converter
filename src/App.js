import React from 'react';
import ImageUpload from './ImageUpload';
import Container from 'react-bootstrap/lib/Container';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import Navbar from 'react-bootstrap/lib/Navbar';

// import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

class App extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

          <Container style={{marginTop: '20px'}}>
            <Row className="justify-content-md-center">
              <Col lg={10}>
                <Navbar bg="light" expand="lg" style={{marginBottom: '20px'}}>
                  <Navbar.Brand>WhatsApp Stickers Converter (Chrome Desktop only)</Navbar.Brand>
                </Navbar>
              </Col>
            </Row>

            <Row className="justify-content-md-center">
              <Col lg={10}>
                <ImageUpload></ImageUpload>
              </Col>
            </Row>
          </Container>

        );
    }
}

export default App;
