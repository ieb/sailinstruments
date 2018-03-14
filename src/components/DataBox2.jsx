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
    this.app = props.app;

    this.state = {
        value : 0,
        title: props.title,
        units: props.units,
        withBox: props.withBox || false,
        updaterate : props.updaterate || 1000
    };
    this.props = {};
    this.setProps(props);
    this.props = props;
    this.update = this.update.bind(this);
  }

  static getDefaultProperties(app) {
    return {
        updaterate: 1000,
        dataPath: app.sourceId+".navigation.speedThroughWater",
        units: "kn",
        title: "stw"
    }
  }

  setProps(props) {
    if ( this.props.withBox ) {
      this.outerClassName = "dataBox dataBoxFill";
    } else {
      this.outerClassName = "dataBox";      
    }
    var top = props.top || 0;
    var left = props.left || 0;
    this.possition = {
      top: top+"px",
      left: left+"px"
    }
    this.setPaths(props);

  }

  setPaths(props) {
    if ( this.props.dataPath === undefined || props.dataPath !== this.props.dataPath) {
      this.dataPath = this.props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
      this.dataStream = this.app.stats.addPath(this.dataPath);      
    }
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
    this.setProps(nextProps);
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
    return (
      <div className={this.outerClassName} style={this.possition} >
        <div className="dataBoxValue">{this.state.value}</div>
        <div className="dataBoxUnits">{this.state.units}</div>
        <div className="dataBoxTitle">{this.state.title}</div>
      </div>
      );
  }

}

export default DataBox;