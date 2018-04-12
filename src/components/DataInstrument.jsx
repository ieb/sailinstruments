/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';
import units from './units.js';
import _ from "lodash";

class DataInstrument extends React.Component {
  /**
   * <DataBox translate="50,5" 
   *      path="path",
   *      displayvalue="function(x) { return x; }"
   *      title"awa"
   */
  constructor(props) {
    super(props);
    this.app = props.app;
    this.props = {};
    this.setProps(props);
    this.streamSwitched = true;
    this.props = props;
    var display = units.displayForFullPath(0, this.dataPath);
    this.state = {
        value : 0,
        title: display.title,
        units: display.units,
        withBox: props.withBox || false,
        updaterate : +props.updaterate || 1000,
        damping: props.damping || 4
    };
    this.cstate = {
      value: 0
    };
    this.update = this.update.bind(this);
  }

  static updateDefaultProperties(app, newTab, layout) {
    layout.contents.className="";
    _.defaults(layout.contents.props,{
       updaterate: 1000,
        damping: 2,
        dataPath: "_preferred.navigation.speedThroughWater",
    });
  }



  static generateComponent(props, app) {
    return (
        <DataInstrument withBox={props.withBox} 
          updaterate={props.updaterate}
          translate={props.translate}
          dataPath={props.dataPath}
          damping={props.damping}
          app={app}  />
        );
  }

  setProps(props) {
    if ( this.props.withBox ) {
      this.outerClassName = "dataBoxFull dataBoxFill";
    } else {
      this.outerClassName = "dataBoxFull";      
    }
    var top = props.top || 0;
    var left = props.left || 0;
    this.possition = {
      top: top+"px",
      left: left+"px"
    }
    if ( this.dataStream === undefined ||  this.dataPath === undefined || props.dataPath !== this.dataPath) {
      this.dataPath = props.dataPath || "_preferred.navigation.speedThroughWater";
      console.log("Setting path ", this.dataPath);
      this.dataStream = this.app.stats.addPath(this.dataPath);   
      this.streamSwitched = true;
    }
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps(this, nextProps);
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
      if ( this.streamSwitched ) {
        this.cstate.value = this.dataStream.value;
        this.streamSwitched = false;
      } else {
        this.cstate.value = this.dataStream.calcIIR(this.cstate.value, this.state.damping);
      }
      var display = units.displayForFullPath(this.cstate.value, this.dataPath);
      if (this.dataPath.endsWith("datetime") || this.dataPath.endsWith("position")) {
        console.log({ path:this.dataPath, dstream:this.dataStream, csvalue: this.cstate.value, dvalue: display});
      }
      display.style = {};
      var finalDisplayLength = (""+display.value).length;
      if (finalDisplayLength > 5) {
        display.style["font-size"] = "25px";
      }
      this.setState(display);
      setTimeout(this.update, this.state.updaterate);
    }
  }

  render() {
    return (
      <div>
      <div className={this.outerClassName} style={this.possition} >
        <div className="dataBoxValue" style={this.state.style} >{this.state.value}</div>
        <div className="dataBoxUnits">{this.state.units}</div>
        <div className="dataBoxTitle">{this.state.title}</div>
      </div>
      </div>
      );
  }

}

export default DataInstrument;