import React from 'react';
import ImageUpload from './ImageUpload';

import './App.css';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = { pictures: [] };
        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(picture) {
        this.setState({
            pictures: this.state.pictures.concat(picture),
        });
    }

    render() {
        return (
            <ImageUpload></ImageUpload>
        );
    }
}

export default App;
