/*jshint node:true */
"use strict";

import React from 'react';
import {render} from 'react-dom';
import SignalKClientConnector from './databus/SignalKClientConnector.jsx';
import Calculations from './components/calcs/calculations.jsx';
import Stats from './components/Stats.jsx';
import Layout from './components/Layout.jsx';
import LayoutRaw from './components/LayoutRaw.jsx';
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
        this.sourcePriority = props.sourcePriority;
        this.defaultSourceId = props.defaultSourceId;
        this.databus = new StreamBundle();
        this.clientConnector = new SignalKClientConnector({
           databus : this.databus,
           autoconnect: true 
        });
        this.knownKeys = {};
        this.layout = undefined;
        this.settings = undefined;
        var self = this;
        this.state = {
        };
      
        var isUnkownKey = function(source) {
            return typeof self.knownKeys[source.key] === 'undefined';
        }.bind(this);
        this.databus.allSources.filter(isUnkownKey).onValue(this.handlePossiblyNewSource.bind(this));
        this.calculations = new Calculations(this.databus);
        this.stats = new Stats({
          historyTime: 20000,
          historyPeriod: 1000,
          app: this
        });
        this.openGlobalSettings = this.openGlobalSettings.bind(this);
        this.addTab = this.addTab.bind(this);
  }
  handlePossiblyNewSource(newSource) {
    this.knownKeys[newSource.key] = newSource;
    console.log("Added NewSource ", newSource.key, " to ", this.knownKeys);
  }

  componentDidMount() {
    this.calculations.connect();
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





// perhaps this wants to be in the layout ?

  openGlobalSettings() {
    var self = this;
    this.setState({ settings: React.createElement(GlobalSettings, 
      { 
        url: self.clientConnector.url, 
        defaultSourceId: self.defaultSourceId,
        sourcePriority: self.sourcePriority,
        update: (update) => {
          if ( self.clientConnector.url !== update.url) {
            self.clientConnector.doConnect(update.url);
          }
          self.defaultSourceId = update.defaultSourceId;
          self.sourcePriority = update.sourcePriority;
          self.setState({settings: ""});
        } ,
        remove: () => {
          self.setState({settings: ""});
        }
      }
    ) });
  }


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
        </div> 

    </div>
    );
  }
}



//  <Calculations  databus={this.databus} sourceId="nmeaFromFile.II" />

const element = <App defaultSourceId="nmeaFromFile"  sourcePriority="" ></App>;    

console.log("Now Running");
document.body.className = "running";
render(element, document.getElementById("react"));
