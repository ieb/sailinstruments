/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.js';

class DataBox extends React.Component {
  /**
   * <DataBox translate="50,5" 
   *      sourceId="sourceId" 
   *      path="path",
   *      displayvalue="function(x) { return x; }"
   *      title"awa"
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
        value : 0
    };
    this.transform="translate ("+this.props.translate+")";
    if ( typeof this.props.displayValue === "function") {
      this.displayValue = this.props.displayValue; 
    } else {
      console.log("No display value supplied ", this.props.displayValue);
      this.displayValue = function(x) { return x; }
    }
    var self = this;
    this.app.stats.addPath(this.props.path);
    this.updaterate = props.updaterate || 1000;
    this.update = this.update.bind(this);
  }

  static getDefaultProperties() {
    return {
        updaterate: 1000,
        translate: "0,0",
        path: "navigation.speedThroughWater",
        units: "kn",
        title: "stw"
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
      this.setState({value: this.props.displayValue(vs[this.props.path].value)});
      setTimeout(this.update, this.updaterate);
    }
  }

  render() {
    return (
      <g transform={this.transform}  className="data-box" >
          {this.props.withBox && <rect width="120" height="50" x="-60" y="-37" rx="5" ry="5"  ></rect>}
          <text x="0" y="0" textAnchor="middle" fontSize="38" >{this.state.value}</text>
          <text x="55" y="10" textAnchor="end" fontSize="15" >{this.props.title}</text>
      </g>
      );
  }

}

export default DataBox;