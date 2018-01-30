/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.js'
import Qty  from 'js-quantities';


const radToDeg = Qty.swiftConverter('rad', 'deg')

class CompassRose extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        oppositeTackDirection: props.oppositeTackDirection || 340,
        groundWindDirection: props.groundWindDirection || 50,
        magneticHeading: props.magneticHeading || 282,
        northup: props.northup
    };


     var self = this;
    this.valueStreams = [
      {
        sourceId: this.props.sourceId,
        path: "navigation.headingMagnetic",
        update : (function(value) {
          self.update("magneticHeading", radToDeg(value));
        })
      },
      {
        sourceId: this.props.sourceId,
        path: "performance.headingMagnetic",
        update : (function(value) {
          self.update("oppositeTackDirection", radToDeg(value));
        })
      },
      {
        sourceId: this.props.sourceId,
        path: "environment.wind.directionTrue",
        update : (function(value) {
          self.update("groundWindDirection", radToDeg(value));
        })
      },

    ];
  }


  componentDidMount() {
    utils.resolve(this.valueStreams, this.props.databus, this.props.sourceId);
    utils.subscribe( this.valueStreams, this);
  }

  componentWillUnmount() {
    utils.unsubscribe(this.valueStreams);
  }


  update(key, value) {
    var newState = {};
    newState[key] = value;
    this.setState(newState);
  }

  getRoseRotation() {
    if (this.state.northup) {
      return 0;
    } else {
      return this.state.magneticHeading;
    }
  }



  render() {

    const generateRotation = function(angle) {
        return 'rotate( '+angle+' 300 300 )';
    } 

 
    const majorTicks = Array.from(new Array(17),(val,index)=>(index+1)*10).map((n) =>
          <path d="M 300 48 L 300 60 M 300 540 L 300 552" key={n}  strokeWidth="2" transform={generateRotation(n)} ></path>
    );
    const minorTicks = Array.from(new Array(18),(val,index)=>5+(index)*10).map((n) =>
          <path d="M 300 53 L 300 60 M 300 540 L 300 547"  key={n} strokeWidth="1" transform={generateRotation(n)} ></path>
    );
    const subMinorTicks = (function() {
      let op = [];
      for ( var i = 1; i < 180; i++) {
        if ( i%5 !== 0 ) {
          op.push((<path d="M 300 55 L 300 60 M 300 540 L 300 545"  key={i} strokeWidth="0.5" transform={generateRotation(i)} ></path>));
        }
      }
      return op;
    })();
    const majorNumberValues = [ 90, 180, 270 ];
    const majorNumberLabels = majorNumberValues.map((n) =>
          <text x="300" y="35" textAnchor="middle" key={n} style={{fontSize: '20px'}}  transform={generateRotation(n)} 
              >{"000".substr(n.toString().length)+n.toString()}</text>
    );
    const minorNumberLabels = (function() {
      var op = [];
      for ( var i = 1; i < 36; i++) {
        if ( i%9 !== 0 ) {
          let n = i*10;
          let ns = n.toString();
          let nstxt = "000".substr(ns.length)+ns;
          op.push((        
            <text x="300" y="45" textAnchor="middle" key={i} style={{fontSize: '15px'}}  transform={generateRotation(n)} 
            >{nstxt}</text>
            ));
        }
      }
      return op;
    })();

    const createRoseMarker = function(id) {
      return (
        <g transform="translate(0,-85)" >
            <circle cx="300" cy="100" r="15" strokeWidth="0"  ></circle>
            <polygon points="285,103 300,135 315,103" strokeWidth="0"  ></polygon>
            <circle cx="300" cy="100" r="11" className="light-area" stroke="#333" strokeWidth="0"  ></circle>
            <text x="300" y="106" textAnchor="middle" className="light-area" style={{fontSize: '20px'}} >{id}</text>
        </g>
      );
    }

    const groundWindRoseMarker = createRoseMarker('G');
    const oppositeTackDirectionMarker = createRoseMarker('0');



    return (
    <g  transform={generateRotation(this.getRoseRotation())} >
        {majorTicks}
        {minorTicks}
        {subMinorTicks}
        <circle cx="300" cy="300" r="240" fill="none" strokeWidth="1" ></circle> 
        <path d="M 300 20 L 295 60 300 60 300 20  M 300 560 L 305 540 300 540 300 560 "  
            className="dark-area" strokeWidth="0.5"  transform="rotate( 0 300 300 )" ></path>
        <path d="M 300 20 L 305 60 300 60 300 20  M 300 560 L 295 540 300 540 300 560 "  
            className="light-area" strokeWidth="0.5"  transform="rotate( 0 300 300 )" ></path>
        <path d="M 300 40 L 295 60 300 60 300 40  M 300 560 L 305 540 300 540 300 560 "  
          className="dark-area" strokeWidth="0.5"  transform="rotate( 90 300 300 )" ></path>
        <path d="M 300 40 L 305 60 300 60 300 40  M 300 560 L 295 540 300 540 300 560 "  
          className="light-area" strokeWidth="0.5"  transform="rotate( 90 300 300 )" ></path>
        {majorNumberLabels}
        {minorNumberLabels}
        <text x="300" y="20" textAnchor="middle" style={{fontSize: '28px'}}  transform="rotate( 0 300 300 )" >N</text>
        <text x="300" y="15" textAnchor="middle" style={{fontSize: '28px'}}  transform="rotate( 90 300 300 )">E</text>
        <text x="300" y="15" textAnchor="middle" style={{fontSize: '28px'}} transform="rotate( 180 300 300 )">S</text>
        <text x="300" y="15" textAnchor="middle" style={{fontSize: '28px'}} transform="rotate( 270 300 300 )" >W</text>
        <g transform={generateRotation(this.state.groundWindDirection)} className="ground-wind">
            {groundWindRoseMarker}
        </g>
        <g transform={generateRotation(this.state.oppositeTackDirection)} className="rose-marker" >
            {oppositeTackDirectionMarker}
        </g>
    </g>
  );
  }

}

export default CompassRose;