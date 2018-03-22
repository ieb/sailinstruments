/*jshint node:true */
"use strict";

import React from 'react';
import PolarChart from './PolarChart.jsx';
import utils from './utils.jsx';
import _ from "lodash";

class PolarInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
      updaterate: props.updaterate
    };
  }

  static updateDefaultProperties(app, newTab, layout) {
    _.defaults(layout.contents.props,{
        updaterate: 1000,
        damping: 2
    });
  }



  static generateComponent(props, app) {
    return (
        <PolarInstrument
          updaterate={props.updaterate}
          app={app} 
          damping={props.damping} />
        );
  }

  setProps(props) {
    this.props = props;
  }

  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps(this, nextProps);
  }


  render() {
    return (
        <div className="instrumentContainer"  >
          <PolarChart northup={this.state.northup} app={this.app} updaterate={this.state.updaterate} width="620" height="620" />
        </div>
    );
  }

}

export default PolarInstrument;