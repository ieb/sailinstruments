/*jshint node:true */
"use strict";

import React from 'react';
import sk from '@signalk/client';
const SignalkClient = sk.Client;
//import InternalDemo from "./InternalDemo";

class SignalKClientConnector {

  constructor(props) {
    this.databus = props.databus;
    this.client = undefined;
    this.autoconnect = props.autoconnect;
    this.connectHost = props.connectHost || "localhost:3000";
    this.sourceType = props.sourceType || "signalk";
    this.connectionError = "";
    this.onStartConnect = this.onStartConnect.bind(this);
    this.onStartDisconnect = this.onStartDisconnect.bind(this);
    this.handleDeltaMessage = this.handleDeltaMessage.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
    if (this.autoconnect) {
      this.doConnect();
    }
  }


  handleDeltaMessage(delta) {
    this.databus.handleDelta(delta);
  }
  handleConnect(connection) {
    this.connection = connection;
    this.connected = true;
    this.connectionError = "connected ok"; 
  }
  handleDisconnect() {
    this.connected =  false;
    this.connectionError = "Disconnected"; 
  }
  handleError(error) {
    this.connectionError =  "Error "+error;
  }
  handleClose(event) {
    this.connection = undefined;
    this.connected = false;
    this.connectionError = "closed connection.";
    
  }

  doConnect() {
      console.log("Connecting to signalk");
      this.client = new SignalkClient();
      this.connection =  this.client.connectDelta(this.connectHost,
          this.handleDeltaMessage, 
          this.handleConnect,
          this.handleDisconnect,
          this.handleError,
          this.handleClose);
    if (this.sourceType === "signalk" ) {
    } else if ( this.sourceType === "internal" ) {
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
    this.doConnect();
    this.connected = true;
    this.connectionError = "connected ok";

  }
  onStartDisconnect (event) {
    this.doDisconnect();
    this.connected = false;
    this.connectionError = "disconnected ok";
  }
}

export default SignalKClientConnector;