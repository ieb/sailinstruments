/*jshint node:true */
"use strict";

import React from 'react';
import Modal from 'react-modal';

/**
 * GLobal settings UI, will take the state of the parent on create
 * expects 
 */
class GlobalSettings extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
        modalIsOpen : true,
        url: props.url
    };
    this.update = props.update;
    this.remove = props.remove;
    this.closeModal = this.closeModal.bind(this);
    this.applySettings = this.applySettings.bind(this);
  }


  // specific
  applySettings(event) {
    // might do validation here.
    this.update({url: this.state.url});
    this.closeModal();
    event.preventDefault();
    return false;
  }

  closeModal() {
    console.log("Closing settings dialog");
    this.setState({ modalIsOpen: false});
    this.remove();
  }


  // specific.
  showFormContent() {
    return (<div>
        <label>SignalK URL: <input type="text"  value={this.state.url} onChange={(e) => { this.setState({ url: e.target.value })}} /></label> 
        </div>);
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

      <form onSubmit={this.applySettings} >
        <div className="settingsClose" ><button onClick={this.closeModal}>&#10754;</button></div>
        {this.showFormContent()}
        <div className="settingsCancel" ><button onClick={this.closeModal}>Cancel</button></div> 
        <div className="settingsApply" ><input type="submit" value="Apply" /></div> 
      </form>
      </Modal>
    );
  }

}

export default GlobalSettings;