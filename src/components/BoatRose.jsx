/*jshint node:true */
"use strict";

import React from 'react';
import * as d3 from 'd3';
import utils from './utils.jsx';


class BoatRose extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
        leewayAngle: 5,
        awa: 30,
        twa: 20,
        vmga: 10,
        hdm: 340,
        headup: props.headup,
        twaHistory: [],
        awaHistory: [],
        updaterate: props.updaterate || 1000
    };

    console.log("New BoatRose Headup ", this.state.headup);

    this.setPaths(this.props);

    var self = this;
    this.bound = false;
    this.update = this.update.bind(this);
  }

  setPaths(props) {
    this.leewayPath = props.leewayPath || this.app.sourceId+".performance.leeway";
    this.awaPath = props.awaPath || this.app.sourceId+".environment.wind.angleApparent";
    this.twaPath = props.twaPath || this.app.sourceId+".environment.wind.angleTrue";
    this.targetAnglePath = props.targetAnglePath || this.app.sourceId+".performance.targetAngle";
    this.hdmPath = props.hdmPath || this.app.sourceId+".navigation.headingMagnetic"
    this.leewayStream = this.app.stats.addPath(this.leewayPath);
    this.awaStream = this.app.stats.addPath(this.awaPath, true);
    this.twaStream = this.app.stats.addPath(this.twaPath, true);
    this.targetAngleStream = this.app.stats.addPath(this.targetAnglePath);
    this.hdmStream = this.app.stats.addPath(this.hdmPath);    
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
    for(var k in nextProps ) {
      if (k.endsWith("Path") && nextProps[k] !== this[k] ) {
        this.setPaths(nextProps);
        break;
      }
    }
    if ( update ) {
        this.setState(newState);
    }
  }


  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;
      console.log("Bound BoatRose");
      this.update();      
    }
  }

  componentWillUnmount() {
    this.bound = false;
    console.log("UnBound BoatRose");
  }

  update() {
    if ( this.bound ) {
      var vs = this.app.stats.valueStreams;
      this.setState({
        twaHistory: utils.convertDegA(this.twaStream.history),
        awaHistory: utils.convertDegA(this.awaStream.history),
        leewayAngle: utils.convertDeg(this.leewayStream.value),
        awa: utils.convertDeg(this.awaStream.value),
        twa: utils.convertDeg(this.twaStream.value),
        vmga: utils.convertDeg(this.targetAngleStream.value),
        hdm: utils.convertDeg(this.hdmStream.value),
      });            
      setTimeout(this.update, this.state.updaterate);
    }
  }


  // -------------------------- rendering ----------------------------------


  getRoseRotation() {
    if (this.state.headup) {
      return 0;
    } else {
      return this.state.hdm;
    }
  }


  generateHistoryLine(c, history) {
    const radialLine = d3.radialLine().curve(d3.curveBasis);
    let a = [];
    for (let i = 0; i < history.length-1; i++) { 
        a.push([ history[i]*Math.PI/180, 200-(history.length-i-1)*(200/20)]);
    };
    a.push([ c*Math.PI/180, 200]);
    return radialLine(a);
  } 


  render() {

    const generateRotation = function(angle) {
        return 'rotate( '+angle+' 300 300 )';
    } 


    const majorTicks = Array.from(new Array(17),(val,index)=>(index+1)*10).map((n) =>
          <path d="M 300 48 L 300 60 M 300 540 L 300 552" className="majorNumbers" key={n}  strokeWidth="2" transform={generateRotation(n)} ></path>
    );
    const minorTicks = Array.from(new Array(18),(val,index)=>5+(index)*10).map((n) =>
          <path d="M 300 53 L 300 60 M 300 540 L 300 547" className="minorNumbers" key={n} strokeWidth="1" transform={generateRotation(n)} ></path>
    );

    const allTicks = (function() {
        var op = [];
        for (var i = 0; i < 18; i++) {
          if ( i%3 === 0) {
            op.push((<path d="M 300 100 L 300 130 M 300 482 L 300 500" key={i} strokeWidth="3" transform={generateRotation(i*10)} ></path>));
          } else {
            op.push((<path d="M 300 100 L 300 115 M 300 485 L 300 500" key={i} strokeWidth="1" transform={generateRotation(i*10)} ></path>));
          }
        }
        return op;
      })();

    const fineTicks = (function() {
        var op = [];
        for (var i = 1; i < 40; i++) {
          if ( i%10 !== 0 ) {
            if ( i%5 === 0 ) {
              op.push((<path d="M 300 100 L 300 110 M 300 490 L 300 500" key={i} strokeWidth="1" transform={generateRotation(i)} ></path>));
              op.push((<path d="M 300 100 L 300 110 M 300 490 L 300 500" key={-i} strokeWidth="1" transform={generateRotation(-i)} ></path>));
            } else {
              op.push((<path d="M 300 100 L 300 106 M 300 494 L 300 500" key={i} strokeWidth="1" transform={generateRotation(i)} ></path>));
              op.push((<path d="M 300 100 L 300 106 M 300 494 L 300 500" key={-i} strokeWidth="1" transform={generateRotation(-i)} ></path>));
            }
          }
        }
        return op;
      })();

    const numbering = (function() {
        var op = [];
        for (var i = 30; i < 180; i+=30){
          op.push((<text x="300" y="155" textAnchor="middle" key={i} style={{fontSize:'28px'}} transform={generateRotation(i)} >{i.toString()}</text>));
          op.push((<text x="300" y="155" textAnchor="middle" key={-i} style={{fontSize:'28px'}} transform={generateRotation(-i)} >{-i.toString()}</text>));
        }
        op.push((<text x="300" y="155" textAnchor="middle" key="180" style={{fontSize:'28px'}} transform="rotate( 180 300 300 )" >180</text>));
        return op;    
      })();

    const createRoseMarker = function(id) {
      return (
        <g transform="translate(0,0)" >
          <circle cx="300" cy="75" r="10" strokeWidth="0"  ></circle>
          <polygon points="290,78 300,100 310,78" strokeWidth="0"  ></polygon>
          <circle cx="300" cy="75" r="9" className="light-area" strokeWidth="0"  ></circle>
          <text x="300" y="79" textAnchor="middle" className="light-area" style={{fontSize:'15px'}} >{id}</text>
        </g>
      );
    };




    return (
    <g transform={generateRotation(this.getRoseRotation())} id="boat" >
        <path d="M 300 60 L 295 75 305 75 300 60 "  className="red-pointer"  strokeWidth="0.5"  ></path>
        <path d="M 300 115 a 185 185 0 0 1 160.21469970012114 92.50000000000001" className="starboard-sector"></path>
        <path d="M 300 115 a 185 185 0 0 0 -160.21469970012114 92.50000000000001" className="port-sector" ></path>
        {allTicks}
        {fineTicks}
        {numbering}
        <path d="M 300 200 A 80,130 0 0,0 280,360 L 300,360" className="boat-port" ></path>        
        <path d="M 300 200 A 80,130 0 0,1 320,360 L 300,360" className="boat-starboard" ></path>        
        <g transform={generateRotation(this.state.awa)} className="apparent-wind" >
            {createRoseMarker('A')}
        </g>
        <g transform={generateRotation(this.state.twa)}  className="true-wind" >
            {createRoseMarker('T')}
        </g>
        <g transform={generateRotation(this.state.leewayAngle)} className="rose-marker" >
            {createRoseMarker('L')}
        </g>
        <g transform="translate(300,300)">
            <path d={this.generateHistoryLine(this.state.awa, this.state.awaHistory)} className="apparent-wind-history"  ></path>
            <path d={this.generateHistoryLine(this.state.twa, this.state.twaHistory)} className="true-wind-history"  ></path>
        </g>
        <g transform={generateRotation(this.state.vmga)} >
            <polygon points="295,115 300,105 305,115" className="dark-area" strokeWidth="0"  ></polygon>
            <text x="300" y="128" textAnchor="middle" style={{fontSize:'10px'}} >VMG</text>
        </g>

    </g>
    );
  }

}

export default BoatRose;