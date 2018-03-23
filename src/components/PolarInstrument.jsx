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
    layout.content.className="cellContainer";
     _.defaults(layout.contents.props,{
        updaterate: 1000,
        damping: 2
    });
    PolarInstrument.updateLayoutContents(app, newTab, layout)
  }

  static updateLayoutContents(app, newTab, layout) {
    layout.contents.props.width = ((newTab.width/newTab.cols)*layout.w);
    layout.contents.props.height = (newTab.rowHeight)*layout.h;
    console.log({ nw: layout.w, nh: layout.h, tw: newTab.width,  th: newTab.rowHeight});
  }


  static generateComponent(props, app) {
    return (
        <PolarInstrument
          updaterate={props.updaterate}
          app={app} 
          damping={props.damping}
          width={props.width}
          height={props.height} />
        );
  }

  setProps(props) {
    this.props = props;
  }

  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps(this, nextProps);
  }

  getScale() {
    var wscale = 1;
    if ( this.container === undefined ) {
      console.log("Container not defined");
    } else {
      wscale = this.container.parentElement.offsetWidth/620;
      console.log({ container: this.container, 
        offsetWidth:this.container.offsetWidth, 
        offsetHeight:this.container.offsetHeight, 
        scale: wscale});
    }
    return { 
      transform: "scale("+wscale+","+wscale+")"
    };
  }



  render() {
    return (
        <div ref={node => this.container = node} className="instrumentContainer" style={this.getScale()}  >
          <PolarChart northup={this.state.northup} app={this.app} updaterate={this.state.updaterate} width="620" height="620" />
        </div>
    );
  }

}

export default PolarInstrument;