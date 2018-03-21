/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import PolarChart from './PolarChart.jsx';

class PolarInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
      updaterate: props.updaterate
    };
  }

  static getDefaultProperties(app,  newTab, width, height) {
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
        <InstrumentContainer width="600" height="600" translate="10,10" >
          <PolarChart app={this.app} updaterate={this.state.updaterate} />
        </InstrumentContainer>

    );
  }

}

export default PolarInstrument;