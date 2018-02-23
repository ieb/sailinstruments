/*jshint node:true */
"use strict";

import React from 'react';
import Modal from 'react-modal';


class ConfigureCell extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        _modalIsOpen : true
    };
    for ( var k in this.props.cell.contents.props ) {
      this.state[k] = this.props.cell.contents.props[k];
    }
    this.onDone = this.onDone.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  onValueChange(event) {
    var newState = {};
    console.log("change event is ", event.target.name, event.target.value);
    if ( typeof this.state[event.target.name] === "boolean") {
      newState[event.target.name] = !(this.state[event.target.name]);
    } else {
      newState[event.target.name] = event.target.value;
    }
    this.setState(newState);    
  }

  onDone(event) {
    console.log("Done");
    this.setState({_modalIsOpen: false});
    var finalConfig = _.clone(this.state);
    delete(finalConfig._modalIsOpen);
    this.props.onDone(finalConfig);
    event.preventDefault();
    return false;
  }

  onCancel(event) {
    this.setState({_modalIsOpen: false});
    console.log("Cancel");
    this.props.onDone();
    event.preventDefault();
    return false;
  }


  afterOpen() {

  }
  requestClose() {

  }

  getPathOptions() {
    var pathOptions = [];
    for (var k in this.props.app.knownKeys) {
      pathOptions.push((<option key={k} value={k} >{k}</option>));
    }
    return pathOptions;
  }

  buildFormContent() {
    var formContent = [];
    console.log("State is ",this.state);
    for ( var k in this.state ) {
      console.log("Rendering ",k,k.charAt(0));
      if ( k.charAt(0) !== '_' ) {
        var value = this.state[k];
        console.log("Value ",value);
        if ( k.endsWith('Path') ) {
          formContent.push((<label  key={k} >{k} <select name={k} value={value} onChange={this.onValueChange} >
            {this.getPathOptions(value)}
            </select></label>
            ));
        } else if ( typeof value === 'boolean') {
          formContent.push((<label key={k} >{k} <input type="checkbox" name={k} checked={value} onChange={this.onValueChange} /></label>))
        } else {
          formContent.push((<label key={k} >{k} <input type="text" name={k} value={value} onChange={this.onValueChange} /></label>))
        }
      } else {
        console.log("Ignoring ", k);
      }
    }
    return formContent;
  }



  render() {
    return (
      <Modal
      isOpen={this.state._modalIsOpen}
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
          <div className="settingsForm" >
          {this.buildFormContent()}
          </div>
          <div className="settingsCancel" ><button onClick={this.onCancel}>Cancel</button></div> 
          <div className="settingsApply" ><input type="submit" value="Apply" /></div> 
          {JSON.stringify(this.props.cell)}
        </form>
      </Modal>
    );
  }

}

export default ConfigureCell;