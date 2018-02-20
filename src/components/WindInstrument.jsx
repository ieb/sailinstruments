/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import CompassRose from './CompassRose.jsx';
import BoatRose from './BoatRose.jsx';
import DataBox from './DataBox.jsx';
import Qty  from 'js-quantities';

class WindInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
      northup: props.northup
    };
  }

  static getDefaultProperties() {
    return {
        northup: true,
        updaterate: 1000
    }
  }

  render() {


    const radToDegC = Qty.swiftConverter('rad', 'deg');
    const radToDeg  = function(x) {
      return radToDegC(x).toFixed(0);
    }
    const msToKnC = Qty.swiftConverter('m/s', 'kn');
    const msToKn = function(x) {
      var v = msToKnC(x);
      if (v < 10) {
        return v.toFixed(2);
      } else {
        return v.toFixed(1);
      }
    }

    const percent = function(x) {
      var v = x * 100;
      if (v < 10) {
        return v.toFixed(1);
      } else {
        return v.toFixed(0);
      }
    }




    return (
          <InstrumentContainer width="600" height="600" translate="10,10" >
                <CompassRose northup={this.state.northup} app={this.app} updaterate={this.props.updaterate} />
                <BoatRose headup={!this.state.northup} app={this.app} updaterate={this.props.updaterate} />
                <DataBox translate="300, 272" withBox={true}
                    app={this.app}
                    path="navigation.speedThroughWater"
                    displayValue={msToKn}
                    title="stw" />
                <DataBox translate="300, 352" withBox={true} 
                    app={this.app}
                    path="environment.wind.speedApparent"
                    displayValue={msToKn}
                    title="aws" />
                <DataBox translate="60, 35" 
                    app={this.app}
                    path="performance.polarSpeed"
                    displayValue={msToKn}
                    title="polar stw" />
                <DataBox translate="60, 85" 
                    app={this.app}
                    path="performance.polarSpeedRatio"
                    displayValue={percent}
                    title="polar %" />
                <DataBox translate="540, 35" 
                    app={this.app}
                    path="performance.targetAngle"
                    displayValue={radToDeg}
                    title="target twa" />
                <DataBox translate="540, 85" 
                    app={this.app}
                    path="performance.targetSpeed"
                    displayValue={msToKn}
                    title="target stw" />

                <DataBox translate="540, 550" 
                    app={this.app}
                    path="performance.headingMagnetic"
                    displayValue={radToDeg}
                    title="tack dir" />
                <DataBox translate="540, 600" 
                    app={this.app}
                    path="performance.ignore"
                    displayValue={radToDeg}
                    title="box number 6" />
                <DataBox translate="60, 550" 
                    app={this.app}
                    path="performance.leeway"
                    displayValue={msToKn}
                    title="leeway" />
                <DataBox translate="60, 600" 
                    app={this.app}
                    path="performance.ignore"
                    displayValue={msToKn}
                    title="box number 8" />
            </InstrumentContainer>
    );
  }

}

export default WindInstrument;