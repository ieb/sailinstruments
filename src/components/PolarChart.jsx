/*jshint node:true */
"use strict";

import React from 'react';
import * as d3 from 'd3';
import utils from './utils.jsx'
import Qty  from 'js-quantities';


const msToKnC = Qty.swiftConverter('m/s', 'kn');
const knToMsC = Qty.swiftConverter('kn', 'm/s');


class PolarChart extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
      headup: true,
      stw: 0,
      tws: 0,
      twa: 0,
      targetSpeed: 0,
      targetAngle: 0,
      maxStw: 0,
      scale: 0,
      polarCurve: [],
      twaHistory : [],
      stwHistory: [],
      updaterate: props.updaterate || 1000
    };

    this.setPaths(props);

    this.bound = false;
    var self = this;
    this.update = this.update.bind(this);

  }


  setPaths(props) {
    this.hdmPath = this.props.hdmPath || this.app.sourceId+".navigation.headingMagnetic";
    this.otherTackDirPath = this.props.otherTackDirPath || this.app.sourceId+".performance.headingMagnetic";
    this.twsPath = this.props.twsPath || this.app.sourceId+".environment.wind.speedTrue";
    this.twaPath = this.props.twaPath || this.app.sourceId+".environment.wind.angleTrue";
    this.stwPath = this.props.stwPath || this.app.sourceId+".navigation.speedThroughWater";
    this.targetSpeedPath = this.props.targetSpeedPath || this.app.sourceId+".performance.targetSpeed";
    this.targetAnglePath = this.props.targetAnglePath || this.app.sourceId+".performance.targetAngle";

    this.hdmStream = this.app.stats.addPath(this.hdmPath);
    this.otherTackDirStream = this.app.stats.addPath(this.otherTackDirPath);
    this.twsStream = this.app.stats.addPath(this.twsPath);
    this.twaStream = this.app.stats.addPath(this.twaPath,true);
    this.stwStream = this.app.stats.addPath(this.stwPath, true);
    this.targetSpeedStream = this.app.stats.addPath(this.targetSpeedPath);
    this.targetAngleStream = this.app.stats.addPath(this.targetAnglePath);
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
      this.update();
    }
  }

  componentWillUnmount() {
    this.bound = false;
  }


  // state management ---------------------------------------------------------------------------------------------
  //

  update() {
    if (this.bound) {
      var tws = utils.convertKn(this.twsStream.value);

      if ( tws < 0.01 ) {
        this.setState({
          tws: tws,
          maxStw: 2,
          scale: 240/2,
          polarCurve: [],
          stw: utils.convertKn(this.stwStream.value),
          twa: utils.convertDeg(this.twaStream.value),
          targetSpeed: utils.convertKn(this.targetSpeedStream.value),
          targetAngle: utils.convertDeg(this.targetAngleStream.value),
          twaHistory : utils.convertDegA(this.twaStream.history),
          stwHistory: utils.convertKnA(this.stwStream.history)
          });

      } else {
        var polarCurve = this.app.calculations.polarPerformance.performanceForSpeed(knToMsC(tws));
        // polarCurve is [ { tws: < rad >, stw: <m/s>}]
        // needs to be [[x,y]]
        var plot = [];
        var maxStw = 0;
        for (var i = 0; i < polarCurve.length; i++) {
           polarCurve[i].stw = msToKnC(polarCurve[i].stw);
          if ( polarCurve[i].stw > maxStw ) {
            maxStw = polarCurve[i].stw;
          }
        }
        // fix the max based on lookup to keep the display more stable.
        //
        if ( maxStw > this.state.maxStw ) {
          // must be increased
          var m = (Math.floor((maxStw*1.2)/2)+1)*2;
          console.log("Increasing ", maxStw, this.state.maxStw, m);
          maxStw = m;
        } else if ( maxStw < this.state.maxStw*0.6 ) {
          // must be decreased.
          var m = (Math.floor((maxStw*1.2)/2)+1)*2;
          console.log("Decreasing ", maxStw, this.state.maxStw, m);
          maxStw = m;
        } else {
          maxStw = this.state.maxStw;
        }

        // the outer ring is at 240 from the center.
        var scale = 240/maxStw;
        var a = [];
        for (var i = 0; i < polarCurve.length; i++) {
          a.push([polarCurve[i].twa, polarCurve[i].stw*scale]);
        };
        for (var i = polarCurve.length-1; i >= 0; i--) {
          a.push([(Math.PI*2)-polarCurve[i].twa, polarCurve[i].stw*scale]);
        };
        //console.log("Polar curve is ", maxStwn, scalen, polarCurve);
        //console.log("PolarLine is ",a);
        this.setState({
          tws: tws,
          maxStw: maxStw,
          scale: scale,
          polarCurve: a,
          stw: utils.convertKn(this.stwStream.value),
          twa: utils.convertDeg(this.twaStream.value),
          targetSpeed: utils.convertKn(this.targetSpeedStream.value),
          targetAngle: utils.convertDeg(this.targetAngleStream.value),
          twaHistory : utils.convertDegA(this.twaStream.history),
          stwHistory: utils.convertKnA(this.stwStream.history)
        });        
      }
      setTimeout(this.update, this.state.updaterate);
    }
  }


  // -------------------------------- rendering ------------------------------

  getRoseRotation() {
    if (this.state.headup) {
      return 0;
    } else {
      return -this.state.hdm;
    }
  }


  generateRotation(angle) {
    if ( isNaN(angle) ) {
      console.log("Nan Angle");
      return 'rotate( 0 300 300 )';
    } else {
      return 'rotate( '+angle+' 300 300 )';        
    }
  } 

  // render ---------------------------------------------------------------------------------------------
  // bunch of constants first.

  render() {

    var self = this;

 
    const majorTicks = Array.from(new Array(17),(val,index)=>(index+1)*10).map((n) =>
          <path d="M 300 48 L 300 60 M 300 540 L 300 552" key={n}  strokeWidth="2" transform={self.generateRotation(n)} ></path>
    );
    const minorTicks = Array.from(new Array(18),(val,index)=>5+(index)*10).map((n) =>
          <path d="M 300 53 L 300 60 M 300 540 L 300 547"  key={n} strokeWidth="1" transform={self.generateRotation(n)} ></path>
    );
    const subMinorTicks = (function() {
      let op = [];
      for ( var i = 1; i < 180; i++) {
        if ( i%5 !== 0 ) {
          op.push((<path d="M 300 55 L 300 60 M 300 540 L 300 545"  key={i} strokeWidth="0.5" transform={self.generateRotation(i)} ></path>));
        }
      }
      return op;
    })();
    const majorNumberValues = [ 90, 180, 270 ];
    const majorNumberLabels = majorNumberValues.map((n) =>
          <text x="300" y="35" textAnchor="middle" key={n} style={{fontSize: '20px'}}  transform={self.generateRotation(n)} 
              >{"000".substr(n.toString().length)+n.toString()}</text>
    );
    const minorNumberLabels = (function() {
      var op = [];
      for ( var i = 1; i < 18; i++) {
          let n = i*10;
          let nstxt = n.toString();
          op.push((        
            <text x="300" y="45" textAnchor="middle" key={i} style={{fontSize: '15px'}}  transform={self.generateRotation(n)} 
            >{nstxt}</text>));
          op.push((
            <text x="300" y="45" textAnchor="middle" key={-i} style={{fontSize: '15px'}}  transform={self.generateRotation(-n)} 
            >{nstxt}</text>
            ));
      }
      op.push((
          <text x="300" y="45" textAnchor="middle" key={180} style={{fontSize: '15px'}}  transform={self.generateRotation(180)} 
          >180</text>
          ));
      return op;
    })();

    const radialLines = (function() {
      var lines = [];
      for (var i = 0; i < 180; i+= 10) {

          lines.push((<path d="M 300 60 L 300 290 M 300 310 L 300 540 "  key={i} strokeWidth="1" transform={self.generateRotation(i)} ></path>));
      };
      return lines;
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
    <g  transform={this.generateRotation(this.getRoseRotation())} >
        {majorTicks}
        {minorTicks}
        {minorNumberLabels}
        {radialLines}
        {this.generateCircular()}
        {this.generatePolarLine()}
        {this.generateHistoryMarkers()}       
        {this.drawWindAngles()}
    </g>
  );
  }

/*
        <g transform="translate(300,300)">
            <path d={this.generateHistoryLine(0,25,false)}  className="polar-speed-history-25"></path>
            <path d={this.generateHistoryLine(25,50, false)} className="polar-speed-history-50" ></path>
            <path d={this.generateHistoryLine(50,75, false)} className="polar-speed-history-75"  ></path>
            <path d={this.generateHistoryLine(75,100, true)} className="polar-speed-history-100"  ></path>
        </g>
*/

  // Generators, dynamic markup ----------------------------------------------------------------------------------------------
  generateCircular() {
    var circles = [];
    var step = 2;
    if ( this.state.maxStw < 5 ) {
      step = 1;
    }
    for (var i = 0; i <= this.state.maxStw; i+= step) {
        var radius = this.state.scale * i;
        var textPos = 300-radius;
        circles.push((<circle cx="300" cy="300"  r={radius} key={i} fill="none"  ></circle>));
        circles.push((<text x="300" y={textPos} key={-(i+1)} textAnchor="middle" className="light-area" style={{fontSize: '20px'}} >{i}</text>));
    };
    return circles;
  }

  drawWindAngles() {
    // target wind and target speed line.
    // current wind and current speed line
    var boatSpeedMarker = (300-this.state.stw*this.state.scale);
    var tagetSpeedMarker = (300-this.state.targetSpeed*this.state.scale);
    var boatSpeedLine =  "M 300 300 L 300 "+boatSpeedMarker;
    var targetSpeedLine = "M 300 300 L 300 "+tagetSpeedMarker;
    return [
        (
          <g transform={this.generateRotation(this.state.twa) } key="boat" className="true-wind-marker"  >
            <path d={boatSpeedLine} className="true-wind-history" ></path>
            <circle cx="300" cy={boatSpeedMarker} r="5" ></circle>
          </g>
        ),(
          <g transform={this.generateRotation(this.state.targetAngle) } key="target" >
            <path d={targetSpeedLine} ></path>
            <circle cx="300" cy={tagetSpeedMarker} r="5" ></circle>
          </g>
        )
        ];
  }


  generatePolarLine() {
    const radialLine = d3.radialLine().curve(d3.curveBasis);
    return (
        <g transform="translate(300,300)">
          <path d={radialLine(this.state.polarCurve)} className="polar-speed-graph"  ></path>
        </g>
        );
  } 

  generateHistoryMarkers() {
    var m = [];
    for (var i = 0; i < this.state.twaHistory.length; i++) {
      var transform = this.generateRotation(this.state.twaHistory[i]);
      var pos = 300-(this.state.stwHistory[i]*this.state.scale);
      var color = "rgba(0,255,0,"+i/this.state.twaHistory.length+")";
      m.push((<circle cx="300" cy={pos} r="3" key={i} transform={transform} fill={color} strokeWidth="0" ></circle>));
    };
    return m;
  }


  generateHistoryLine(startpc, endpc, current) {
    if ( this.state.twaHistory.length < 10 ) {
      return "";
    }
    var start = Math.min(Math.floor(this.state.twaHistory.length*(startpc/100)), this.state.twaHistory.length-1);
    var end = Math.min(Math.floor(this.state.twaHistory.length*(endpc/100)), this.state.twaHistory.length-1);
    const radialLine = d3.radialLine().curve(d3.curveBasis);
    let a = [];
    var twa;
    for (let i = start; i <= end; i++) { 
        twa = this.state.twaHistory[i];
        if (twa < 0) {
          twa = 360+twa;
        }
        a.push([ twa*Math.PI/180, this.state.stwHistory[i]*this.state.scale]);
    };
    if (current) {
      twa = this.state.twa;
      if (twa < 0) {
        twa = 360+twa;
      }
      a.push([ twa*Math.PI/180, this.state.stw*this.state.scale]);      
    }
    return radialLine(a);
  } 



}

export default PolarChart;