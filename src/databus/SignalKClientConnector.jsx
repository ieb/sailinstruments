/*jshint node:true */
"use strict";

import React from 'react';
import Client from '@signalk/client';
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
      this.doConnect(this.getDefaultUrl());
    }
    this.updateConfig = this.updateConfig.bind(this);
    props.configStream.onValue(this.updateConfig);
  }

  getDefaultUrl() {
    var url = window.location.protocol+"//"+window.location.hostname+":"+window.location.port;
    if ( window.location.protocol.startsWith("file:")) {
      url = "http://localhost:3000";  // assume there is a sk server on localhost.
    } else if ( url.endsWith(":") ) {
      url = url.substring(0,url.length-1);
    }
    return url;
  }


  updateConfig(config) {
    console.log("Got new Config ", config);
    if (config.signalkUrl !== undefined && config.signalkUrl !==  this.signalkUrl ) {
      this.doConnect(config.signalkUrl);
    }
  }


  handleDeltaMessage(delta) {
    this.databus.handleDelta(delta);
  }
  handleConnect(connection) {
    this.connection = connection;
    this.connected = true;
    this.connectionError = "connected ok"; 
    this.client.subscribe(); 
  }
  handleDisconnect() {
    this.connected =  false;
    this.connectionError = "Disconnected"; 
  }
  handleError(error) {
    this.connectionError =  "Error "+error;
    console.log("Error",error);
  }
  handleClose(event) {
    this.connection = undefined;
    this.connected = false;
    this.connectionError = "closed connection.";
    
  }

  doConnect(signalkUrl) {
    console.log("Connecting to signalk at ",signalkUrl, this.connection);
    if ( signalkUrl === "default" || signalkUrl === undefined ) {
      signalkUrl = this.getDefaultUrl();
    }
    if ( this.connection !== undefined && typeof this.connection.close === "function" ) {
      this.connection.close();
    }
    if ( this.client == undefined ) {
      var url = new URL(signalkUrl);
      this.client = new Client({
        hostname: url.hostname,
        port: url.port,
        reconnect: true,
        autoConnect: false,
        useTLS: (url.protocol === "https"),
        notifications: false
      });
    }
    this.client.on('delta', this.handleDeltaMessage);
    this.client.on('connect', this.handleConnect);
    this.client.on('disconnect', this.handleDisconnect);
    this.client.on('error', this.handleError);
    this.client.on('close', this.handleClose);
    this.client.connect();
    this.signalkUrl = signalkUrl;
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