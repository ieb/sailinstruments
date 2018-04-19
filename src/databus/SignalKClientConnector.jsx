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
    this.sourceType = props.sourceType || "signalk";
    this.connectionError = "";
    this.onStartConnect = this.onStartConnect.bind(this);
    this.onStartDisconnect = this.onStartDisconnect.bind(this);
    this.handleDeltaMessage = this.handleDeltaMessage.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // default to the same server the UI was loaded from.

    if (this.autoconnect) {
      this.doConnect(this.getDefaultSocket());
    }
    this.updateConfig = this.updateConfig.bind(this);
    props.configStream.onValue(this.updateConfig);
  }

  getDefaultSocket() {
    var hostPort = window.location.hostname+":"+window.location.port;
    if ( window.location.protocol.startsWith("file:")) {
      hostPort = "localhost:3000";  // assume there is a sk server on localhost.
    } else if ( hostPort.endsWith(":") ) {
      hostPort = hostPort.substring(0,hostPort.length-1);
    }
    return hostPort;    
  }

  updateConfig(config) {
    console.log("Got new Config ", config);
    if (config.socket !== undefined && config.socket !==  this.hostPort ) {
      this.doConnect(config.socket);
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

  doConnect(connectHost) {
    console.log("Connecting to signalk at ",connectHost, this.connection);
    if ( connectHost === "default" || connectHost === undefined ) {
      connectHost = this.getDefaultSocket();
    }
    if ( this.connection !== undefined && typeof this.connection.close === "function" ) {
      this.connection.close();
    }
    if ( this.client == undefined ) {
      this.client = new SignalkClient();
    }
    this.connection =  this.client.connectDelta(connectHost,
        this.handleDeltaMessage, 
        this.handleConnect,
        this.handleDisconnect,
        this.handleError,
        this.handleClose);
    this.hostPort = connectHost;
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