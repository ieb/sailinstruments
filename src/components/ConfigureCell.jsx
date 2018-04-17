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
    this.formRender = this.props.cell.contents.formRender;
    this.onDone = this.onDone.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.stateCB = [];
  }

  bindGetState(cb) {
    this.stateCB.push(cb);
  }


  onValueChange(event) {
    var newState = {};
    console.log("change event is ", event.target.name, event.target.value);
    var value = this.state[event.target.name];
    if ( value.value === undefined ) {
      if ( typeof value === "number") {
        newState[event.target.name] = +value;
      } else if ( typeof value === "boolean") {
        newState[event.target.name] = !(value);
      } else {
        newState[event.target.name] = event.target.value;
      }
    } else {
      newState[event.target.name] = _.merge({}, value);
      if ( typeof value === "number") {
        newState[event.target.name].value = +value;
      } else if ( typeof value.value === "boolean") {
        newState[event.target.name].value  = !(value.value);
      } else {
        newState[event.target.name].value = event.target.value;
      }
    }
    this.setState(newState);    
  }

  onDone(event) {
    console.log("Done");
    this.setState({_modalIsOpen: false});
    var finalConfig = _.clone(this.state);
    for (var i = 0; i < this.stateCB.length; i++) {
      finalConfig = _.merge(finalConfig, this.stateCB[i]());
    };
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

  getPathOptions(value) {
    var pathOptions = [];
    for (var k in this.props.app.knownKeys) {
      pathOptions.push((<option key={k} value={k} >{k}</option>));
    }
    return pathOptions;
  }



  buildFormContent() {
    if ( typeof this.formRender === 'function' ) {
      return this.formRender(this, this.state);
    } else {
      return (<div className="settingsForm" >{this.internalBuildContent()}</div>);
    }
  }

  internalBuildContent() {
      var formContent = [];
      console.log("State is ",this.state);
      for ( var k in this.state ) {
        console.log("Rendering ",k,k.charAt(0));
        if ( k.charAt(0) !== '_' ) {
          var value = this.state[k];
          if ( value.value === undefined ) {
            value = {
              value: this.state[k],
              title: k,
              help: ""
            }
          }
          formContent.push((<label key={"lab"+k} >{value.title}</label>));
          console.log("Value ",value);
          if ( k.endsWith('Path') ) {
              formContent.push((<select key={k} name={k} value={value.value} onChange={this.onValueChange} >
                {this.getPathOptions(value.value)}
                </select>
                ));
          } else if ( typeof value.value === 'boolean') {
            formContent.push((<input key={k} type="checkbox" name={k} checked={value.value} onChange={this.onValueChange} />))
          } else if ( typeof value.value === 'number') {
            if ( value.min === undefined || value.max === undefined || value.step === undefined) {
              formContent.push((<input key={k} type="number" name={k} value={value.value} onChange={this.onValueChange} />));
            } else {
              formContent.push((<input key={k} type="number" name={k}
                  min={value.min} max={value.max} step={value.step} 
                  value={value.value} onChange={this.onValueChange} />));
            }
          } else {
             formContent.push((<input key={k} type="text" name={k} value={value.value} onChange={this.onValueChange} />))
          }
          if ( value.help !== undefined) {
            formContent.push((<div key={"h"+k} className="help">{value.help}</div>));
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
          {this.buildFormContent()}
          <div className="settingsCancel" ><button onClick={this.onCancel}>Cancel</button></div> 
          <div className="settingsApply" ><input type="submit" value="Apply" /></div> 
        </form>
      </Modal>
    );
  }

}

export default ConfigureCell;