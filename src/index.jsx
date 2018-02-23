import React from 'react';
import {render} from 'react-dom';
import SignalKClientConnector from './databus/SignalKClientConnector.jsx';
import Calculations from './components/calcs/calculations.jsx';
import Stats from './components/Stats.jsx';
import Layout from './components/Layout.jsx';
import LayoutRaw from './components/LayoutRaw.jsx';
import DataInstrument from './components/DataInstrument.jsx';
import GlobalSettings from './components/settings/GlobalSettings.jsx';
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
        this.props = props;
        this.databus = new StreamBundle();
        this.clientConnector = new SignalKClientConnector({
           databus : this.databus,
           autoconnect: true,
           connectHost : "localhost:3000" 
        });
        this.sourceId = this.props.sourceId;
        this.knownKeys = {};
        this.layout = undefined;
        this.settings = undefined;
        var self = this;
        this.state = {
           url : "http://localhost:3000"
        };
      
        var isUnkownKey = function(source) {
            return typeof self.knownKeys[source.key] === 'undefined';
        }.bind(this);
        console.log("A1");
        this.databus.allSources.filter(isUnkownKey).onValue(this.handlePossiblyNewSource.bind(this));
        console.log("A2");

        this.calculations = new Calculations(this.databus, this.sourceId);
        this.stats = new Stats({
          historyTime: 20000,
          historyPeriod: 1000,
          app: this
        });
        console.log("A3");
        this.openGlobalSettings = this.openGlobalSettings.bind(this);
        this.addTab = this.addTab.bind(this);
  }
  handlePossiblyNewSource(newSource) {
    this.knownKeys[newSource.key] = newSource;
    // console.log("Added NewSource ", newSource.key, " to ", this.knownKeys);
  }

  componentDidMount() {
        console.log("A4");
    this.calculations.connect();
        console.log("A5");
  }

  componentWillUnmount() {
    this.calculations.disconnect();
  }

  registerLayout(layout) {
    this.layout = layout;
  }

  addTab() {
    if ( this.layout !== undefined ) {
      this.layout.addTab();
    }
  }



  openGlobalSettings() {
    var self = this;
    this.setState({ settings: React.createElement(GlobalSettings, 
      { 
        url: this.state.url, 
        update: (update) => {
          self.setState({url: update.url});
        } ,
        remove: () => {
          self.setState({settings: ""});
        }
      }
    ) });
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
    console.log("Starting to render");
    return ( 
        <div>
        <div className="fullbrightness">
            {this.state.settings}
            <div className="globalSettingsButton">
              <button onClick={(event) => { this.openGlobalSettings(); }}>&#9432;</button>
              <button onClick={(event) => { this.addTab(); }}>&#10753;</button>
            </div>
            <Layout app={this} />
            <DataInstrument app={this} />
            <LayoutRaw app={this} />
        </div> 

    </div>
    );
  }
}

/*
            <InstrumentContainer width="600" height="600" translate="10,10" >
                <CompassRose northup={true} app={this} />
                <BoatRose headup={false} app={this} />
                <DataBox translate="300, 272" withBox={true}
                    app={this}
                    path="navigation.speedThroughWater"
                    displayValue={msToKn}
                    title="stw" />
                <DataBox translate="300, 352" withBox={true} 
                    app={this}
                    path="environment.wind.speedApparent"
                    displayValue={msToKn}
                    title="aws" />

                <DataBox translate="60, 35" 
                    app={this}
                    path="performance.polarSpeed"
                    displayValue={msToKn}
                    title="polar stw" />
                <DataBox translate="60, 85" 
                    app={this}
                    path="performance.polarSpeedRatio"
                    displayValue={percent}
                    title="polar %" />
                <DataBox translate="540, 35" 
                    app={this}
                    path="performance.targetAngle"
                    displayValue={radToDeg}
                    title="target twa" />
                <DataBox translate="540, 85" 
                    app={this}
                    path="performance.targetSpeed"
                    displayValue={msToKn}
                    title="target stw" />

                <DataBox translate="540, 550" 
                    app={this}
                    path="performance.headingMagnetic"
                    displayValue={radToDeg}
                    title="tack dir" />
                <DataBox translate="540, 600" 
                    app={this}
                    path="performance.ignore"
                    displayValue={radToDeg}
                    title="box number 6" />
                <DataBox translate="60, 550" 
                    app={this}
                    path="performance.leeway"
                    displayValue={msToKn}
                    title="leeway" />
                <DataBox translate="60, 600" 
                    app={this}
                    path="performance.ignore"
                    displayValue={msToKn}
                    title="box number 8" />

            </InstrumentContainer>

            <InstrumentContainer width="600" height="600" translate="10,10" >
              <PolarChart app={this} />
            </InstrumentContainer>


*/

//  <Calculations  databus={this.databus} sourceId="nmeaFromFile.II" />

const element = <App sourceId="nmeaFromFile" ></App>;    

render(element, document.getElementById("react"));