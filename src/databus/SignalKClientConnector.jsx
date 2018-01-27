/*jshint node:true */
"use strict";

import React from 'react';
import sk from '@signalk/client';
const SignalkClient = sk.Client;
//import InternalDemo from "./InternalDemo";

class SignalKClientConnector extends React.Component {

  constructor(props) {
    super(props);
    this.databus = props.databus;
    this.client = undefined;
    this.state = {
        autoconnect : props.autoconnect,
        connectHost : props.connectHost || "localhost:3000",
        sourceType: props.sourceType || "signalk",
        connectionError: ""
    };
    this.onStartConnect = this.onStartConnect.bind(this);
    this.onStartDisconnect = this.onStartDisconnect.bind(this);
    this.handleSourceTypeChange = this.handleSourceTypeChange.bind(this);
    this.handleURLChange = this.handleURLChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDeltaMessage = this.handleDeltaMessage.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
    console.log("ConnectState ",this.state, this.props);
    if (this.state.autoconnect) {
      this.doConnect();
    }
  }


  handleDeltaMessage(delta) {
    console.log("Got "+delta);
    this.databus.handleDelta(delta);
  }
  handleConnect(connection) {
    this.connection = connection;
    this.setState({ 
      connected: true,
      connectionError: "connected ok" 
    });    
  }
  handleDisconnect() {
    this.setState({ 
      connected: false,
      connectionError: "Disconnected" 
    });    
  }
  handleError(error) {
    this.setState({ 
      connectionError: "Error "+error
    });
    
  }
  handleClose(event) {
    this.connection = undefined;
    this.setState({ 
      connected: false,
      connectionError: "closed connection." 
    });
    
  }

  doConnect() {
      console.log("Connecting to signalk");
      this.client = new SignalkClient();
      this.connection =  this.client.connectDelta(this.state.connectHost,
          this.handleDeltaMessage, 
          this.handleConnect,
          this.handleDisconnect,
          this.handleError,
          this.handleClose);
    if (this.state.sourceType === "signalk" ) {
    } else if ( this.state.sourceType === "internal" ) {
      //this.client = new InternalDemo(this.state.connectHost,
      //    this.handleDeltaMessage, 
      //    this.handleConnect,
      //    this.handleDisconnect,
      //    this.handleError,
      //    this.handleClose
      //  );
    }
   }

  doDisconnect() {
    if ( this.connection !== undefined) {
      this.connection.disconnect();
    }
  }


  onStartConnect (event) {
    console.log("Connecting with ",this.state);
    this.doConnect();
    this.setState({ 
      connected: true,
      connectionError: "connected ok" 
    });

  }
  onStartDisconnect (event) {
    this.doDisconnect();

    this.setState({ 
      connected: false,
      connectionError: "disconnected ok" 
    });
  }
  handleURLChange (event) {
    this.setState({ connectHost: event.target.value});
  }
  handleSourceTypeChange (event) {
    this.setState({ sourceType: event.target.value});
  }

  handleSubmit(event) {
      event.preventDefault();
  }

  render() {
    if ( this.state.autoconnect ) {
      return (<div className="connectionError">{this.state.connectionError}</div>);
    } else {
      if ( this.state.connected ) {
        return (
          <form className="connectionSettings" onSubmit={this.handleSubmit} >
          <label>
            SourceType: {this.state.sourceType}
          </label>
          <label>
            Source: {this.state.connectHost}
          </label>
          <div className="disconnectButton" ><button onClick={this.onStartDisconnect}>Disconnect</button></div>
          </form>
        );
      } else {
        return (
          <form className="connectionSettings" onSubmit={this.handleSubmit}>
            <label>
            Source type:
            <select value={this.state.sourceType} onChange={this.handleSourceTypeChange}>
              <option value="signalk">SignalK server</option>
              <option value="internal">Internal demo</option>
            </select>
            </label>
            <label>
            Source:
            <input type="text" name="url" value={this.state.connectHost} onChange={this.handleURLChange} ></input>
            </label>
            <div className="connectButton" ><button onClick={this.onStartConnect}>Connect</button></div>
            <div>
            SignalK expects a http url,  tcp and udp expect a host:port pair only.
            </div>
            <div className="connectionError">{this.state.connectionError}</div>
          </form>
        );
      }      
    }
  }

}

export default SignalKClientConnector;