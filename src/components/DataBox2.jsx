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
        damping:  props.damping || 2,
        title: props.title || "stw",
        units: props.units || "kn",
        withBox: props.withBox || false,
        updaterate : +props.updaterate || 1000
    };
    this.cstate = {
      value: 0
    }
    this.props = {};
    this.setProps(props);
    this.props = props;
    this.update = this.update.bind(this);
  }

  static getDefaultProperties(app, newTab, width, height) {
    return {
        updaterate: 1000,
        dataPath: app.sourceId+".navigation.speedThroughWater",
        damping: 2,
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
    if ( this.dataStream === undefined || this.dataPath === undefined || props.dataPath !== this.dataPath) {
      this.dataPath = props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
      console.log("Updateing datapath ", this.dataPath);
      this.dataStream = this.app.stats.addPath(this.dataPath);      
    }
  }


  componentWillReceiveProps(nextProps) {
    var newState = {};
    var update = false;
    for(var k in this.state) {
      if ( nextProps[k] !== undefined && this.state[k] !== nextProps[k]) {
        var type = typeof this.state[k];
        console.log("Prop Change ", { from: this.state[k], to: nextProps[k], allNewProps:nextProps, type:type});
        if ( typeof this.state[k] === 'number') {
          newState[k] = +nextProps[k];
        } else {
          newState[k] = nextProps[k];
        }
        update = true;
      }
    }
    this.setProps(nextProps);
    if ( update ) {
        console.log("Setting State", { old: this.stat, newState: newState});
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
      this.cstate.value = this.dataStream.calcIIR(this.cstate.value, this.state.damping);
      this.setState({
        value: utils.getDisplay(this.state.units)(this.cstate.value)
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