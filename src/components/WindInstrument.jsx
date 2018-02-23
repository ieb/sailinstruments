/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import CompassRose from './CompassRose.jsx';
import BoatRose from './BoatRose.jsx';
import DataBox from './DataBox.jsx';

class WindInstrument extends React.Component {

  constructor(props) {
    super(props);
    console.log("New Wind Instrument with Nortup set to ",props.northup);
    this.app = props.app;
    this.props = props;
    this.state = {
      northup: props.northup,
      updaterate: props.updaterate
    };
  }

  static getDefaultProperties(app) {
    return {
        northup: true,
        updaterate: 1000
    }
  }

  static generateComponent(props, app) {
    console.log("Generate WindInstument Element with ",props);
    return (
        <WindInstrument northup={props.northup} updaterate={props.updaterate} app={app} />
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
                <CompassRose northup={this.state.northup} app={this.app} updaterate={this.state.updaterate} />
                <BoatRose headup={!this.state.northup} app={this.app} updaterate={this.state.updaterate} />
                <DataBox translate="300, 272" 
                    withBox={true}
                    app={this.app}
                    dataPath={this.app.sourceId+".navigation.speedThroughWater"}
                    units="kn"
                    title="stw" />
                <DataBox translate="300, 352" 
                    withBox={true} 
                    app={this.app}
                    dataPath={this.app.sourceId+".environment.wind.speedApparent"}
                    units="kn"
                    title="aws" />
                <DataBox translate="60, 35" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.polarSpeed"}
                    units="kn"
                    title="polar stw" />
                <DataBox translate="60, 85" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.polarSpeedRatio"}
                    units="%"
                    title="polar %" />
                <DataBox translate="540, 35" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.targetAngle"}
                    units="deg"
                    title="target twa" />
                <DataBox translate="540, 85" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.targetSpeed"}
                    units="kn"
                    title="target stw" />

                <DataBox translate="540, 550" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.headingMagnetic"}
                    units="deg"
                    title="tack dir" />
                <DataBox translate="540, 600" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.ignore"}
                    units="deg"
                    title="box number 6" />
                <DataBox translate="60, 550" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.leeway"}
                    units="deg"
                    title="leeway" />
                <DataBox translate="60, 600" 
                    app={this.app}
                    dataPath={this.app.sourceId+".performance.ignore"}
                    units="kn"
                    title="box number 8" />
            </InstrumentContainer>
    );
  }

}

export default WindInstrument;