import React from 'react';
import {render} from 'react-dom';
import InstrumentContainer from './components/InstrumentContainer.jsx';
import CompassRose from './components/CompassRose.jsx';
import BoatRose from './components/BoatRose.jsx';
import Calculations from './components/Calculations.jsx';
import DataBox from './components/DataBox.jsx';
import SignalKClientConnector from './databus/SignalKClientConnector.jsx';
import Qty  from 'js-quantities';
import './style.css';

import StreamBundle from './databus/streambundle.js';


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

class App extends React.Component {
  constructor(props) {
        super(props);
        this.databus = new StreamBundle();
        this.knownKeys = {};
        var self = this;
        var isUnkownKey = function(source) {
            return typeof self.knownKeys[source.key] === 'undefined';
        }.bind(this);
        this.databus.allSources.filter(isUnkownKey).onValue(this.handlePossiblyNewSource.bind(this));
  }
  handlePossiblyNewSource(newSource) {
    this.knownKeys[newSource.key] = newSource;
    console.log("Added NewSource ", newSource.key, " to ", this.knownKeys);
  }


/*
      { path: 'performance.polarSpeed', value: polarPerformance.polarSpeed},   // polar speed at this twa
      { path: 'performance.polarSpeedRatio', value: polarPerformance.polarSpeedRatio}, // polar speed ratio
      { path: 'performance.tackMagnetic', value: track.trackMagnetic}, // other track through water magnetic taking into account leeway 
      { path: 'performance.tackTrue', value: track.trackTrue}, // other track through water true taking into account leeway
      { path: 'performance.headingMagnetic', value: track.headingMagnetic}, // other track heading on boat compass
      { path: 'performance.headingTrue', value: track.headingTrue}, // other track heading true
      { path: 'performance.targetAngle', value: targets.twa}, // target twa on this track for best vmg
      { path: 'performance.targetSpeed', value: targets.stw}, // target speed on at best vmg and angle
      { path: 'performance.targetVelocityMadeGood', value: targets.vmg}, // target vmg -ve == downwind
      { path: 'performance.velocityMadeGood', value: polarPerformance.vmg}, // current vmg at polar speed
      { path: 'performance.polarVelocityMadeGoodRatio', value: polarPerformance.polarVmgRatio} // current vmg vs current polar vmg.

*/

  render () {
    return ( 
        <div>
        <SignalKClientConnector databus={this.databus} autoconnect={true} connectHost="localhost:3000" />
        <div className="fullbrightness">
            <InstrumentContainer width="600" height="600" translate="10,10" >
                <CompassRose northup={true} databus={this.databus} sourceId="nmeaFromFile" />
                <BoatRose headup={false} databus={this.databus} sourceId="nmeaFromFile" />
                <DataBox translate="300, 272" withBox={true}
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="navigation.speedThroughWater"
                    displayValue={msToKn}
                    title="stw" />
                <DataBox translate="300, 352" withBox={true} 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="environment.wind.speedApparent"
                    displayValue={msToKn}
                    title="aws" />

                <DataBox translate="60, 35" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.polarSpeed"
                    displayValue={msToKn}
                    title="polar stw" />
                <DataBox translate="60, 85" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.polarSpeedRatio"
                    displayValue={percent}
                    title="polar %" />

                <DataBox translate="540, 35" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.targetAngle"
                    displayValue={radToDeg}
                    title="target twa" />
                <DataBox translate="540, 85" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.targetSpeed"
                    displayValue={msToKn}
                    title="target stw" />

                <DataBox translate="540, 550" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.headingMagnetic"
                    displayValue={radToDeg}
                    title="tack dir" />
                <DataBox translate="540, 600" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.ignore"
                    displayValue={radToDeg}
                    title="box number 6" />
                <DataBox translate="60, 550" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.leeway"
                    displayValue={msToKn}
                    title="leeway" />
                <DataBox translate="60, 600" 
                    databus={this.databus}
                    sourceId="nmeaFromFile" 
                    path="performance.ignore"
                    displayValue={msToKn}
                    title="box number 8" />


            </InstrumentContainer>
        </div>
        <Calculations  databus={this.databus} sourceId="nmeaFromFile" />
        </div>
    );
  }
}

//  <Calculations  databus={this.databus} sourceId="nmeaFromFile.II" />
       
render(<App/>, document.getElementById("react"));