/*jshint node:true */
"use strict";

import React from 'react';
import Modal from 'react-modal';


class ConfigureGridElement extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        modalIsOpen : true,
        value: props.value || "none"
    };
    this.onDone = this.onDone.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  onValueChange(event) {
    this.setState({
      value: event.target.value
    });    
  }

  onDone(event) {
    console.log("Done");
    this.setState({modalIsOpen: false});
    this.props.onDone(this.state.value);
    event.preventDefault();
    return false;
  }

  onCancel(event) {
    this.setState({modalIsOpen: false});
    console.log("Cancel");
    this.props.onDone(this.state.value);
    event.preventDefault();
    return false;
  }


  afterOpen() {

  }
  requestClose() {

  }




  render() {
    return (
      <Modal
      isOpen={this.state.modalIsOpen}
      onAfterOpen={this.afterOpen}
      onRequestClose={this.requestClose}
      contentLabel={this.state.title} 
      ariaHideApp={false}
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

        <form onSubmit={this.onDone} >
          <div className="settingsClose" ><button onClick={this.onCancel}>&#10754;</button></div>
          {JSON.stringify(this.props.gridElement)}

          <div className="settingsCancel" ><button onClick={this.onCancel}>Cancel</button></div> 
          <div className="settingsApply" ><input type="submit" value="Apply" /></div> 
        </form>
      </Modal>
    );
  }

}

export default ConfigureGridElement;