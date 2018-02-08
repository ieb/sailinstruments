/*jshint node:true */
"use strict";

import React from 'react';
import Modal from 'react-modal';

class SettingsScreen extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.app.registerSettings(this);
    this.state = {
        modalIsOpen : false,
    };
    this.onSomeEvent = this.onSomeEvent.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.applySettings = this.applySettings.bind(this);

  }

  openModal(dialogElements) {
    console.log("Opening settings dialog");
    this.setState({
      modalIsOpen: true,
      dialogElements: dialogElements
    });
  }
  closeModal() {
    console.log("Closing settings dialog");
    this.setState({
      modalIsOpen: false,
      dialogElements: undefined
    });
  }
  applySettings() {
    console.log("Applying  settings dialog");
    this.closeModal();
  }
  onSomeEvent () {
    let newSomeState = this.state.somestate + 1;
    this.setState({somestate: newSomeState});
  }

  settngsPage() {
    console.log("Creating settings page ", this.state.dialogElements);
    if ( this.state.dialogElements === undefined ) {

      return (
        <div>Likes : <span>{this.state.somestate}</span>
        <div><button onClick={this.onSomeEvent}>Like Me</button></div>
        </div>
        );
    } else {
      return this.state.dialogElements;
    }

  }

  render() {
    return (
      <Modal
      isOpen={this.state.modalIsOpen}
      onAfterOpen={this.afterOpenFn}
      onRequestClose={this.requestCloseFn}
      contentLabel={this.state.title} 
      className={{
        base: 'settings',
        afterOpen: 'settings_after-open',
        beforeClose: 'settings_before-close'
      }}
      overlayClassName={{
        base: 'settingsOverlay',
        afterOpen: 'settingsOverlay_after-open',
        beforeClose: 'settingsOverlay_before-close'
      }}>
        <div className="settingsClose" ><button onClick={this.closeModal}>X</button></div>
      {this.settngsPage()}
      <div className="settingsCancel" ><button onClick={this.closeModal}>Cancel</button></div> 
      <div className="settingsApply" ><button onClick={this.applySettings}>Apply</button></div> 
      </Modal>
    );
  }

}

export default SettingsScreen;