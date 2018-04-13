/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';
import units from './units.jsx';
import _ from "lodash";

class DataBox extends React.Component {
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
    this.updateWithValue = this.updateWithValue.bind(this);
    this.setProps(props);
    this.props = props;
    var display = units.displayForFullPath(0, this.dataPath);

    this.state = {
        value : 0,
        damping:  props.damping || 2,
        title: display.title,
        units: display.units,
        withBox: props.withBox || false,
        updaterate : +props.updaterate || 1000
    };
  }

  static updateDefaultProperties(app, newTab, layout) {
    _.defaults(layout.contents.props,{
        updaterate: 1000,
        dataPath: "_preferred.navigation.speedThroughWater",
        damping: 2
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
    if ( this.dataPath === undefined || props.dataPath !== this.dataPath || props.updaterate !== this.updaterate ) {
      this.dataPath = props.dataPath || "_preferred.navigation.speedThroughWater";
      this.updaterate = props.updaterate;
      this.rebindStream();
    }
  }

  rebindStream() {
    if (this.unsubscribe !== undefined) {
      this.unsubscribe();
    }
    // might want to put damping in here.
    // damping is only worth it if the rate of update is rapid.
    // if its not, then there is no point.
    var cvalue = 0;
    var lastUpdate = 0;
    var self = this;
    var dataStream = this.app.stats.addPath(this.dataPath);
    this.unsubscribe = dataStream.stream
        .debounceImmediate(this.updaterate)
        .onValue((v) => {
          var n = Date.now();
          if ( (n-lastUpdate) > 900 ) {
            cvalue = v;
          } else {
            cvalue = dataStream.calcIIRf(cvalue, v, self.state.damping);
          }
          lastUpdate = n;
          self.updateWithValue(cvalue);
        });
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps( this, nextProps);
  }



  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;
      this.rebindStream();
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe !== undefined) {
      this.unsubscribe();
    }
    this.bound = false;
  }


  updateWithValue(value) {
    if ( this.bound ) {
      var display = units.displayForFullPath(value, this.dataPath);
      this.setState(display);
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