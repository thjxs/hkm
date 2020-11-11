import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as hkm from './hkManager';
import './main.css';

class App extends Component {
  fileRef: React.RefObject<HTMLInputElement> = React.createRef();
  state = {
    editing: false,
    errorMessage: '',
    originalFileData: '',
    fileData: '',
    filename: '',
  };
  onFileChange = () => {
    if (!this.fileRef.current) {
      return;
    }
    const { files } = this.fileRef.current;
    if (!files) {
      return;
    }
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.addEventListener('load', () => {
      const result: any = reader.result;
      try {
        const decrypted: string = hkm.decode(new Uint8Array(result));
        console.log(decrypted);

        const jsonString: string = JSON.stringify(
          JSON.parse(decrypted),
          undefined,
          2
        );
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
  onEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <div className="container mx-auto p-2">
        <div className="flex justify-between">
          <h1 className="text-3xl italic">Hollow Knight save editor</h1>
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
              cols={80}
              rows={24}
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
