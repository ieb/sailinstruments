/*jshint node:true */
"use strict";

import React from 'react';
import CompassRose from './CompassRose2.jsx';
import BoatRose from './BoatRose2.jsx';
import DataBox from './DataBox2.jsx';

class WindInstrument extends React.Component {

  constructor(props) {
    super(props);
    console.log("New Wind Instrument with Nortup set to ",props.northup);
    this.app = props.app;
    this.props = props;
    this.state = {
      northup: props.northup,
      updaterate: +props.updaterate
    };
  }

  static getDefaultProperties(app) {
    return {
        northup: true,
        updaterate: 1000,
        damping: 4
    }
  }

  static generateComponent(props, app) {
    return (
        <WindInstrument northup={props.northup} updaterate={props.updaterate} app={app} damping={props.damping} />
        );
  }

  componentWillReceiveProps(nextProps) {
    var newState = {};
    var update = false;
    for(var k in this.state) {
      if ( nextProps[k] !== undefined && this.state[k] !== nextProps[k]) {
        console.log("Prop Change ", { from: this.state[k], to: nextProps[k], allNewProps:nextProps});
        if ( typeof this.state[k] === 'number') {
          newState[k] = +nextProps[k];
        } else {
          newState[k] = nextProps[k];
        }
        update = true;
      }
    }
    if ( update ) {
        console.log("Setting State", { old: this.stat, newState: newState});
        this.setState(newState);
    }
  }


  render() {
    return (
        <div className="instrumentContainer"  >
            <CompassRose northup={this.state.northup} app={this.app} 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                width="620" height="620" />
            <BoatRose headup={!this.state.northup} app={this.app} 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                width="620" height="620" />
            <DataBox top="250" left="260"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                withBox={true}
                app={this.app}
                dataPath={this.app.sourceId+".navigation.speedThroughWater"}
                units="kn"
                title="stw" />
            <DataBox  top="320" left="260"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                withBox={true} 
                app={this.app}
                dataPath={this.app.sourceId+".environment.wind.speedApparent"}
                units="kn"
                title="aws" />
            <DataBox top="10" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.polarSpeed"}
                units="kn"
                title="polar stw" />
            <DataBox top="65" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.polarSpeedRatio"}
                units="%"
                title="polar %" />
            <DataBox top="505" left="10" 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.targetAngle"}
                units="deg"
                title="target twa" />
            <DataBox top="560" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.targetSpeed"}
                units="kn"
                title="target stw" />

            <DataBox top="10" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.headingMagnetic"}
                units="deg"
                title="tack dir" />
            <DataBox top="65" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.ignore"}
                units="deg"
                title="box number 6" />
            <DataBox top="505" left="510" 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.leeway"}
                units="deg"
                title="leeway" />
            <DataBox top="560" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath={this.app.sourceId+".performance.ignore"}
                units="kn"
                title="box number 8" />
        </div>
    );
  }

}

export default WindInstrument;