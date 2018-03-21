/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import DataBox from './DataBox.jsx';
import Qty  from 'js-quantities';
import utils from './utils.jsx';


class DataInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
      title: props.title || "awa",
      units: props.units || "deg",
      value: 0,
      withBox: props.withBox || false,
      updaterate : props.updaterate || 1000
    };
    this.setPaths(props);
    this.update = this.update.bind(this);

  }

  static getDefaultProperties(app,  newTab, width, height) {
    return {
        withBox: true,
        updaterate: 1000,
        translate: "0,0",
        dataPath: app.sourceId+".environment.wind.angleApparent",
        units: "deg",
        title: "awa"
    }
  }


  static generateComponent(props, app) {
    return (
        <DataInstrument withBox={props.withBox} 
          updaterate={props.updaterate}
          translate={props.translate}
          dataPath={props.dataPath}
          units={props.units}
          title={props.title}
          app={app}  />
        );
  }

  setPaths(props) {
    this.dataPath = props.dataPath || this.app.sourceId+".environment.wind.angleApparent",
    this.dataStream = this.app.stats.addPath(this.dataPath);
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
    for(var k in nextProps ) {
      if (k.endsWith("Path") && nextProps[k] !== this[k] ) {
        this.setPaths(nextProps);
        break;
      }
    }
    if ( update ) {
        this.setState(newState);
    }
  }


  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;
      this.update();
    }
  }

  componentWillUnmount() {
    this.bound = false;
  }

  update() {
    if (this.bound ) {
      this.setState({
        value: utils.getDisplay(this.state.units)(this.dataStream.value),
        });
      setTimeout(this.update, this.state.updaterate);
    } 
  }

  setPath(path) {
    this.path = path;
    this.app.stats.addPath(this.path);
  }



  render() {



    var symbol = utils.getSymbol(this.state.units);

    return (

        <svg viewBox="0,0,120, 60" transform="translate(0,0)" width="120" height="60">
          <g transform="translate(0,0)" className="data-box">
            {this.state.withBox && <rect width="120" height="60" x="0" y="0" rx="5" ry="5"></rect>}
            <text x="110" y="46" textAnchor="end" fontSize="55">{this.state.value}</text>
            <text x="110" y="58" textAnchor="end" fontSize="15">{symbol}</text>
            <text x="2" y="58" textAnchor="start" fontSize="15">{this.state.title}</text>
          </g>
        </svg>
    );
  }

}

export default DataInstrument;