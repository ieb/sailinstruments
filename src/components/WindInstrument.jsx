/*jshint node:true */
"use strict";

import React from 'react';
import CompassRose from './CompassRose.jsx';
import BoatRose from './BoatRose.jsx';
import DataBox from './DataBox.jsx';
import utils from './utils.jsx';
import _ from "lodash";

class WindInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.props = props;
    this.state = {
      northup: props.northup,
      updaterate: +props.updaterate,
      _scale: { 
        transform: "scale(0.5,0.5)"
      }
    };
  }

  static updateDefaultProperties(app, newTab, layout) {
    layout.contents.className="cellContainer";
    _.defaults(layout.contents.props,{
        northup: true,
        updaterate: 1000,
        damping: 4,
        _scale: { 
            transform: "scale(0.5,0.5)"
        }
    });
  }



  static generateComponent(props, app) {
    return (
        <WindInstrument 
            northup={props.northup} 
            updaterate={props.updaterate} 
            app={app} 
            damping={props.damping}
            _scale={{ transform: "scale(0.5,0.5)"}} />
        );
  }

  setProps(props, newState) {
    this.props = props;
    newState._scale = this.getScale();
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
        self.setState({_scale: self.getScale()});
    }, 10);
  }

  componentWillUnmount() {
  }


  render() {
    return (
        <div ref={node => this.container = node} className="instrumentContainer" style={this.state._scale}  >
            <CompassRose northup={this.state.northup} app={this.app} 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                _width="620" _height="620" />
            <BoatRose headup={!this.state.northup} app={this.app} 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                _width="620" _height="620" />
            <DataBox top="250" left="260"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                withBox={true}
                app={this.app}
                dataPath="_preferred.navigation.speedThroughWater" />
            <DataBox  top="320" left="260"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                withBox={true} 
                app={this.app}
                dataPath="_preferred.environment.wind.speedApparent" />
            <DataBox top="10" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.polarSpeed" />
            <DataBox top="65" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.polarSpeedRatio" />
            <DataBox top="505" left="10" 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.targetAngle" />
            <DataBox top="560" left="10"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.targetSpeed" />

            <DataBox top="10" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.headingMagnetic" />
            <DataBox top="65" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.ignore" />
            <DataBox top="505" left="510" 
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.leeway" />
            <DataBox top="560" left="510"
                updaterate={this.state.updaterate} 
                damping={this.state.damping} 
                app={this.app}
                dataPath="calculated.performance.ignore" />
        </div>
    );
  }

}

export default WindInstrument;