/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';
import _ from "lodash";

class DataInstrument extends React.Component {
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
        updaterate : +props.updaterate || 1000,
        damping: props.damping || 4
    };
    this.cstate = {
      value: 0
    };
    this.props = {};
    this.setProps(props);
    this.props = props;
    this.update = this.update.bind(this);
  }

  static updateDefaultProperties(app, newTab, layout) {
    layout.contents.className="";
    _.defaults(layout.contents.props,{
       updaterate: 1000,
        damping: 2,
        dataPath: app.sourceId+".navigation.speedThroughWater",
        units: "kn",
        title: "stw"
    });
  }



  static generateComponent(props, app) {
    return (
        <DataInstrument withBox={props.withBox} 
          updaterate={props.updaterate}
          translate={props.translate}
          dataPath={props.dataPath}
          units={props.units}
          title={props.title}
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
      this.dataPath = props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
      console.log("Setting path ", this.dataPath);
      this.dataStream = this.app.stats.addPath(this.dataPath);      
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
      this.cstate.value = this.dataStream.calcIIR(this.cstate.value, this.state.damping);
      this.setState({
        value: utils.getDisplay(this.state.units)(this.cstate.value)
      });
      setTimeout(this.update, this.state.updaterate);
    }
  }

  render() {
    return (
      <div>
      <div className={this.outerClassName} style={this.possition} >
        <div className="dataBoxValue">{this.state.value}</div>
        <div className="dataBoxUnits">{this.state.units}</div>
        <div className="dataBoxTitle">{this.state.title}</div>
      </div>
      </div>
      );
  }

}

export default DataInstrument;