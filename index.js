import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as hkm from './src/hkManager';
import './main.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      editing: false,
      errorMessage: null,
    };
    this.fileRef = React.createRef();
  }
  onFileChange = () => {
    const { files } = this.fileRef.current;
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.addEventListener('load', () => {
      const result = reader.result;
      try {
        const decrypted = hkm.decode(new Uint8Array(result));
        console.log(decrypted);

        const jsonString = JSON.stringify(JSON.parse(decrypted), undefined, 2);
        this.setState({
          fileData: jsonString,
          originalFileData: jsonString,
          filename: file.name,
          errorMessage: null,
          editing: true,
        });
      } catch (error) {
        console.error(error);
      }
    });
  };
  onEdit = (e) => {
    this.setState({
      fileData: e.target.value,
    });
  };
  reset = () => {
    const { originalFileData } = this.state;
    this.setState({
      fileData: originalFileData,
      errorMessage: null,
    });
  };
  download = () => {
    try {
      const { fileData } = this.state;
      const encrypted = hkm.encode(JSON.stringify(JSON.parse(fileData)));
      hkm.download(encrypted, 'user1.dat');
      this.setState({
        errorMessage: null,
      });
    } catch (error) {
      this.setState({
        errorMessage: 'Invalid JSON, please select another file or reset it',
      });
    }
  };
  render() {
    const { editing, fileData, filename, errorMessage } = this.state;
    return (
      <div className="container mx-auto flex">
        <div className="w-1/3">
          <h1>Hollow Knight save editor</h1>
          <button className="py-2" onClick={() => this.fileRef.current.click()}>
            select file
          </button>
          <input
            hidden
            onChange={this.onFileChange}
            ref={this.fileRef}
            type="file"
          />
          {errorMessage && <p className="my-2">{errorMessage}</p>}
        </div>
        {editing && (
          <div>
            <p className="my-2">{filename}</p>
            <textarea
              cols="64"
              rows="24"
              value={fileData}
              onChange={this.onEdit}
              spellCheck={false}
            ></textarea>
            <div>
              <button className="py-2 px-4" onClick={this.reset}>
                reset
              </button>
              <button className="py-2 px-4" onClick={this.download}>
                download
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#root'));