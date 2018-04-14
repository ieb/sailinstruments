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
      updaterate: props.updaterate,
      scale: { 
        transform: "scale(0.5,0.5)"
      }
    };
  }

  static updateDefaultProperties(app, newTab, layout) {
    layout.contents.className="cellContainer";
     _.defaults(layout.contents.props,{
        updaterate: 1000,
        damping: 2,
        scale: { 
            transform: "scale(0.5,0.5)"
        }
    });
    PolarInstrument.updateLayoutContents(app, newTab, layout)
  }

  static updateLayoutContents(app, newTab, layout) {
    layout.contents.props.width = ((newTab.width/newTab.cols)*layout.w);
    layout.contents.props.height = (newTab.rowHeight)*layout.h;
  }


  static generateComponent(props, app) {
    return (
        <PolarInstrument
          updaterate={props.updaterate}
          app={app} 
          damping={props.damping}
          scale={{ transform: "scale(0.5,0.5)"}} />

        );
  }

  setProps(props, newState) {
    this.props = props;
    newState.scale = this.getScale();
    return true; 
  }

  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps(this, nextProps);
  }

  getScale() {
    var wscale = 1;
    if ( this.container !== undefined ) {
      wscale = this.container.parentElement.offsetWidth/620;
    }
    return { 
      transform: "scale("+wscale+","+wscale+")"
    };
  }

  componentDidMount() {
    var self = this;
    // the values for offsetWitdht are not available immediately.
    // so allow the browser to render and then rset the css scale. 
    setTimeout(() => {
        self.setState({scale: self.getScale()});
    }, 10);
  }

  componentWillUnmount() {
  }



  render() {
    return (
        <div ref={node => this.container = node} className="instrumentContainer" style={this.state.scale}  >
          <PolarChart northup={this.state.northup} app={this.app} updaterate={this.state.updaterate} width="620" height="620" />
        </div>
    );
  }

}

export default PolarInstrument;