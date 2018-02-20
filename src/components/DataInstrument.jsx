/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import DataBox from './DataBox.jsx';
import Qty  from 'js-quantities';

class DataInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    var withBox = true;
    if (props.withBox !== undefined ) {
        withBox = props.withBox;
    }
    this.units = props.units || "deg";
    this.state = {
      withBox : withBox,
      title: props.title || "awa",
      units: this.units,
      value: 0
    };
    this.path = props.path || "environment.wind.angleApparent",
    this.app.stats.addPath(this.path);
    this.setUnits(this.units);
    var self = this;
    console.log(this.state, this.path, this.units);
    this.updaterate = props.updaterate || 1000;
    this.update = this.update.bind(this);

  }

  static getDefaultProperties() {
    return {
        withBox: true,
        updaterate: 1000,
        translate: "0,0",
        path: "environment.wind.angleApparent",
        units: "deg",
        title: "awa"
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
      var vs = this.app.stats.valueStreams;
      this.setState({
        value: this.displayValue(vs[this.path].value),
        units: this.units
        });
      setTimeout(this.update, this.updaterate);
    } 
  }

  setPath(path) {
    this.path = path;
    this.app.stats.addPath(this.path);
  }

  setUnits(units) {
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

    const asIs = function(x) {
        return x;
    }

    if ( units === "deg" ){
        this.displayValue = radToDeg;
    } else if ( units === "kn" ) {
        this.displayValue = msToKn;
    } else if ( units === "%" ) {
        this.displayValue = percent;
    } else {
        this.displayValue = asIs;
    }
    this.units = units;
  }


  render() {
    var symbol = "";
    if ( this.units === "deg" ){
        symbol = "deg"
    } else if ( this.units === "kn" ) {
        symbol = "kn";
    } else if ( this.units === "%" ) {
        symbol = "%";
    } else if ( this.units === "C") {
        symbol = "C"
    }



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