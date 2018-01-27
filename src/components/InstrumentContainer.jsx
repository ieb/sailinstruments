/*jshint node:true */
"use strict";

import React from 'react';

class InstrumentContainer extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      width: props.width || 500,
      height: props.height || 500
    }
  }

  render() {
    // the instument is 0,0,650,650
    return (
      <svg viewBox="0 0 650 650" width={this.state.width} height={this.state.height}>
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