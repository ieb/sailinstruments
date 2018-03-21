/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';

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
        value : 0,
        title: props.title,
        units: props.units,
        translate: props.translate,
        withBox: props.withBox || false,
        updaterate : props.updaterate || 1000
    };
    this.setPaths(this.props);
    this.update = this.update.bind(this);
  }

  static getDefaultProperties(app,  newTab, width, height) {
    return {
        updaterate: 1000,
        translate: "0,0",
        dataPath: app.sourceId+".navigation.speedThroughWater",
        units: "kn",
        title: "stw"
    }
  }

  setPaths(props) {
    this.dataPath = this.props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
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
        value: utils.getDisplay(this.state.units)(this.dataStream.value)
      });
      setTimeout(this.update, this.state.updaterate);
    }
  }

  render() {
    var transform="translate ("+this.state.translate+")";
    return (
      <g transform={transform}  className="data-box" >
          {this.state.withBox && <rect width="120" height="50" x="-60" y="-37" rx="5" ry="5"  ></rect>}
          <text x="0" y="0" textAnchor="middle" fontSize="38" >{this.state.value}</text>
          <text x="55" y="10" textAnchor="end" fontSize="15" >{this.state.title}</text>
      </g>
      );
  }

}

export default DataBox;