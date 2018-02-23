/*jshint node:true */
"use strict";

import React from 'react';

class InstrumentContainer extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;

    var location = this.props.translate || "0,0";
    var transform = "translate("+location+")";
    this.state = {
      width: props.width || 500,
      height: props.height || 500,
      transform: transform
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
    if ( update ) {
        this.setState(newState);
    }
  }

  render() {
    // the instument is 0,0,650,650
    return (
      <svg viewBox="0 0 650 650" transform={this.state.transform} width={this.state.width} height={this.state.height}>
            <g>
              {this.props.children}
            </g>
      </svg>
    );
  }
}
/*
    <svg height="100%" width="100%" viewBox="-100 -100 550 550" >
        <svg >
            <filter id="f1">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"></feGaussianBlur>
                <feOffset dx="2.4" dy="1.6"></feOffset>
                <feMerge>
                    <feMergeNode></feMergeNode>
                    <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
            </filter>
        </svg>
        <g transform="{props.transform}" >
          {props.children}
        </g>
    </svg>
*/
export default InstrumentContainer;