/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.js';

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
    this.props = props;
    this.state = {
        value : 0
    };
    this.transform="translate ("+this.props.translate+")";
    if ( typeof this.props.displayValue === "function") {
      this.displayValue = this.props.displayValue; 
    } else {
      console.log("No display value supplied ", this.props.displayValue);
      this.displayValue = function(x) { return x; }
    }
    var self = this;
    this.valueStreams = [
      {
        sourceId: this.props.sourceId,
        path: this.props.path,
        update : (function(value) {
          self.setState({ value: self.displayValue(value) });
        })
      }
    ];
  }

  componentDidMount() {
    utils.resolve(this.valueStreams, this.props.databus);
    utils.subscribe( this.valueStreams, this);
  }

  componentWillUnmount() {
    utils.unsubscribe(this.valueStreams);
  }

  render() {
    if ( this.props.withBox ) {
    return (
      <g transform={this.transform}  className="data-box" >
          <rect width="120" height="50" x="-60" y="-37" rx="5" ry="5"  ></rect>
          <text x="0" y="0" textAnchor="middle" fontSize="38"  id="AwaterSpeed">{this.state.value}</text>
          <text x="55" y="10" textAnchor="end" fontSize="15" >{this.props.title}</text>
      </g>
      );

    } else {
      return (
        <g transform={this.transform}  className="data-box" >
            <text x="0" y="0" textAnchor="middle" fontSize="38"  id="AwaterSpeed">{this.state.value}</text>
            <text x="55" y="10" textAnchor="end" fontSize="15" >{this.props.title}</text>
        </g>
      );

    }
  }

}

export default DataBox;