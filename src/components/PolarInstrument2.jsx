/*jshint node:true */
"use strict";

import React from 'react';
import PolarChart from './PolarChart2.jsx';

class PolarInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
      updaterate: props.updaterate
    };
  }

  static getDefaultProperties(app) {
    return {
        updaterate: 1000
    }
  }

  static generateComponent(props, app) {
    console.log("Generate PolarInstrument Element with ",props);
    return (
        <PolarInstrument
          updaterate={props.updaterate}
          app={app}  />
        );
  }

  componentWillReceiveProps(nextProps) {
    var newState = {};
    var update = false;
    for(var k in this.state) {
      if ( nextProps[k] !== undefined && this.state[k] !== nextProps[k]) {
        newState[k] = nextProps[k];
        update = true;
      }
    }
    if ( update ) {
        this.setState(newState);
    }
  }


  render() {
    return (
        <div className="instrumentContainer"  >
          <PolarChart northup={this.state.northup} app={this.app} updaterate={this.state.updaterate} width="620" height="620" />
        </div>
    );
  }

}

export default PolarInstrument;