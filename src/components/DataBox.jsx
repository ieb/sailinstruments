/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';
import _ from "lodash";

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

  static updateDefaultProperties(app, newTab, layout) {
    _.defaults(layout.contents.props,{
        updaterate: 1000,
        dataPath: app.sourceId+".navigation.speedThroughWater",
        damping: 2,
        units: "kn",
        title: "stw"
    });
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
    if ( this.dataStream === undefined || this.dataPath === undefined || props.dataPath !== this.dataPath) {
      this.dataPath = props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
      console.log("Updateing datapath ", this.dataPath);
      this.dataStream = this.app.stats.addPath(this.dataPath);      
    }
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps( this, nextProps);
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