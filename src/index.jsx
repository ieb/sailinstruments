/*jshint node:true */
"use strict";

import React from 'react';
import {render} from 'react-dom';
import Bacon from 'baconjs';
import SignalKClientConnector from './databus/SignalKClientConnector.jsx';
import Calculations from './components/calcs/calculations.jsx';
import Stats from './components/Stats.jsx';
import Layout from './components/Layout.jsx';
import StreamBundle from './databus/streambundle.js';
import './style.css';





class App extends React.Component {
  constructor(props) {
        super(props);
        this.props = props;
        this.sourcePriority = props.sourcePriority;
        this.layout = undefined;
        this.configBus = new Bacon.Bus();
        this.configStream = this.configBus.debounceImmediate(200).toProperty();
        this.knownKeys = {};
        this.settings = undefined;
        var self = this;
        this.state = {
        };
        this.databus = new StreamBundle({
          configStream: this.configStream,
        });
        this.clientConnector = new SignalKClientConnector({
          configStream: this.configStream,
          databus : this.databus,
          autoconnect: true 
        });
        this.calculations = new Calculations({
          configStream: this.configStream,
          databus : this.databus
        });
        this.stats = new Stats({
          configStream: this.configStream,
          databus: this.databus,
          historyTime: 20000,
          historyPeriod: 1000
        });

      
        var isUnkownKey = function(source) {
            return typeof self.knownKeys[source.key] === 'undefined';
        }.bind(this);
        this.databus.allSources.filter(isUnkownKey).onValue(this.handlePossiblyNewSource.bind(this));
        this.openGlobalSettings = this.openGlobalSettings.bind(this);
        this.addTab = this.addTab.bind(this);
  }
  handlePossiblyNewSource(newSource) {
    this.knownKeys[newSource.key] = newSource;
    console.debug("Added NewSource ", newSource.key, " to ", this.knownKeys);
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

  openGlobalSettings(sourcePriority, hostPort, polarSourceUrl, feedback) {
    if ( this.layout !== undefined ) {
      this.layout.configureGlobal();
    }
  }

  toggleLock() {
    this.setState({lock: !this.state.lock});
  }

  displaySettingsButtons() {
    if (this.state.lock) {
      return (
        <div className="globalSettingsButton">
          <button onClick={(event) => { this.toggleLock();}}>&#128274;</button>
          <button>&#9432;</button>
          <button>&#10753;</button>
        </div>
      );
    } else {
      return (
        <div className="globalSettingsButton">
          <button onClick={(event) => { this.toggleLock();}}>&#128275;</button>
          <button onClick={(event) => { this.openGlobalSettings(); }}>&#9432;</button>
          <button onClick={(event) => { this.addTab(); }}>&#10753;</button>
        </div>
      );
    }
  }


  render () {
    console.log("Starting to render");
    return ( 
        <div>
        <div>
            {this.state.settings}
            {this.displaySettingsButtons()}
            <Layout app={this} locked={this.state.lock} />
        </div> 

    </div>
    );
  }
}



//  <Calculations  databus={this.databus} sourceId="nmeaFromFile.II" />

const element = <App sourcePriority="" ></App>;    

console.log("Now Running");
render(element, document.getElementById("react"));
