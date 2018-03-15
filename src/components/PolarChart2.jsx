/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx'
import Qty  from 'js-quantities';


const msToKnC = Qty.swiftConverter('m/s', 'kn');
const knToMsC = Qty.swiftConverter('kn', 'm/s');


var instanceId = 0;
class PolarChart extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
      headup: true,
      updaterate: props.updaterate || 1000
    };

    this.cstate = {};
    this.dstate = {};
    this.fontFamily = props.fontFamily || 'sans-serif';

    instanceId++;
    this.polarId = "PolarChart"+instanceId;
    this.polarRingsId = "PolarChartRings"+instanceId;
    this.polarHistoryId = "PolarChartHistory"+instanceId;
    this.significance = {
        hdg: 1,
        boatUp: 1,
        twa: 1,
        awa: 1,
        leeway: 1,
        gwd: 1,
        otack: 1,
        twaHistory: 2,
        awaHistory: 2  
    };


    this.setPaths(props);

    this.bound = false;
    var self = this;
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);


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
        console.log("Prop Change ", { from: this.state[k], to: nextProps[k], allNewProps:nextProps});
        newState[k] = nextProps[k];
        update = true;
      }
    }
    for(var k in nextProps ) {
      if (k.endsWith("Path") && nextProps[k] !== this[k] ) {
        console.log("Set path ", nextProps);
        this.setPaths(nextProps);
        break;
      }
    }
    if ( update ) {
        console.log("Setting State", { old: this.stat, newState: newState});
        this.setState(newState);
    }
  }




  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;
      this.update();
      this.draw();
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
        this.cstate.tws = tws;
        this.cstate.maxStw = 2;
        this.cstate.polarCurve = [];
        this.cstate.stw = utils.convertKn(this.stwStream.value);
        this.cstate.twa = utils.convertDeg(this.twaStream.value);
        this.cstate.targetSpeed = utils.convertKn(this.targetSpeedStream.value);
        this.cstate.targetAngle = utils.convertDeg(this.targetAngleStream.value);
        this.cstate.twaHistory = utils.convertDegA(this.twaStream.history);
        this.cstate.stwHistory = utils.convertKnA(this.stwStream.history);
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
        if ( maxStw > this.cstate.maxStw ) {
          // must be increased
          var m = (Math.floor((maxStw*1.2)/2)+1)*2;
          console.log("Increasing ", maxStw, this.cstate.maxStw, m);
          maxStw = m;
        } else if ( maxStw < this.cstate.maxStw*0.6 ) {
          // must be decreased.
          var m = (Math.floor((maxStw*1.2)/2)+1)*2;
          console.log("Decreasing ", maxStw, this.cstate.maxStw, m);
          maxStw = m;
        } else if ( this.cstate.maxStw !== undefined ) {
          maxStw = this.cstate.maxStw;
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
        this.cstate.tws = tws;
        this.cstate.maxStw = maxStw;
        this.cstate.polarCurve = a;
        this.cstate.stw = utils.convertKn(this.stwStream.value);
        this.cstate.twa = utils.convertDeg(this.twaStream.value);
        this.cstate.targetSpeed = utils.convertKn(this.targetSpeedStream.value);
        this.cstate.targetAngle = utils.convertDeg(this.targetAngleStream.value);
        this.cstate.twaHistory = utils.convertDegA(this.twaStream.history);
        this.cstate.stwHistory = utils.convertKnA(this.stwStream.history);
        if ( this.state.headup ) {
          this.cstate.boatUp = 0;
        } else {
          this.cstate.boatUp = -utils.convertDeg(this.hdmStream.value);
        }
                
      }
      this.draw();
      setTimeout(this.update, this.state.updaterate);
    }
  }

  // -------------------------------- rendering ------------------------------


  clearArea( ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }


  /**
   * Main draw method.
   */
  draw() {
    if (this.bound ) {
      var save = this.drawPolar(); 
      save = this.drawPolarRings() || save;
      save = this.drawPolarHistory() || save;
      if ( save ) {
        utils.saveDrawState(this.cstate, this.dstate, this.significance);
      }
      // perhaps we want to control the refresh rate ?
      //var raf = window.requestAnimationFrame(this.draw);      
    }
  }





  drawPolarVector(ctx, a,s,color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.lineStyle = color;
      ctx.lineWidth = 1;
      ctx.rotate(a*Math.PI/180);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(0,-s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0,-s,5,0,2*Math.PI,true);
      ctx.fill();
      ctx.restore();
  }


  /**
   * Draw the polar curve, vectors and history.
   */
  drawPolarHistory() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp", "maxStw", "twa" ,"stw", "targetAngle", "targetSpeed", "twaHistory", "stwHistory"  ]);
    if ( redrawData !== undefined && redrawData.maxStw !== undefined) {
      var canvas = document.getElementById(this.polarHistoryId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');
        ctx.save();
        this.clearArea(ctx, canvas);
        ctx.translate(310,310);
        // outer rose rotation.
        ctx.rotate(redrawData.boatUp*Math.PI/180);

        var scale = 240/redrawData.maxStw;

        ctx.save();
        var a = [];
        for (var i = 0; i < redrawData.twaHistory.length; i++) {
          a.push([redrawData.twaHistory[i]*Math.PI/180, redrawData.stwHistory[i]*scale]);
        };
        a.push([redrawData.twa*Math.PI/180, redrawData.stw*scale]);
        utils.drawSmoothRadialLine(ctx, a, 2, "rgb(0,255,255)");
        ctx.restore();

        /*
        for ( var i = 0; i < redrawData.twaHistory.length; i++) {
          ctx.save();
          ctx.rotate(redrawData.twaHistory[i]*Math.PI/180);
          ctx.beginPath();
          var s = redrawData.stwHistory[i]*scale;
          ctx.arc(0,-s,3,0,2*Math.PI,true);
          ctx.fillStyle = "rgba(0,0,150,"+(i)/redrawData.twaHistory.length+")";
          ctx.fill();
          ctx.restore();
        }*/
        this.drawPolarVector(ctx, redrawData.twa, redrawData.stw*scale, "blue");
        this.drawPolarVector(ctx, redrawData.targetAngle, redrawData.targetSpeed*scale, "black");
        utils.drawSmoothRadialLine(ctx, redrawData.polarCurve, 1, "black");

        ctx.restore();
        return true;
      }
    }
    return false;

  }



  /**
   * Draw the polar rings.
   */
  drawPolarRings() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp", "maxStw" ]);
    if ( redrawData !== undefined && redrawData.maxStw !== undefined) {
      var canvas = document.getElementById(this.polarRingsId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');
        ctx.save();

        this.clearArea(ctx, canvas);
        ctx.translate(310,310);

        // outer rose rotation.
        ctx.rotate(redrawData.boatUp*Math.PI/180);


        var step = 2;
        if ( redrawData.maxStw < 5 ) {
          step = 1;
        }
        ctx.font = '15px '+this.fontFamily;
        ctx.textAlign = 'center';

        var scale = 240/redrawData.maxStw;

        for ( var i = step; i <= redrawData.maxStw; i+= step) {
          var radius = scale * i;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, 2*Math.PI, false);
          ctx.stroke();
          ctx.fillStyle = "black";
          ctx.fillText(i.toString(), 0, -radius+15);
        }


        ctx.restore();
        return true;
      }
    }
    return false;
  }


  /**
   * Draw the polar rose, no rings, chart of vectors.
   */
  drawPolar() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp" ]);
    if ( redrawData !== undefined) {
      var canvas = document.getElementById(this.polarId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');

        const majorTick = new Path2D("M 0 -252 L 0 -240 M 0 240 L 0 252");
        const minorTick = new Path2D("M 0 -247 L 0 -240 M 0 240 L 0 247");
        const subMinorTick = new Path2D("M 0 -245 L 0 -240 M 0 240 L 0 245");
        const radialSectorLine = new Path2D("M 0 -240 L 0 -10 M 0 10 L 0 240");
        const radial180Line = new Path2D("M 0 10 L 0 240");




        ctx.save();

        {
          this.clearArea(ctx, canvas);
          ctx.translate(310,310);

          // outer rose rotation.
          ctx.rotate(redrawData.boatUp*Math.PI/180);


          ctx.beginPath();
          ctx.arc(0, 0, 240, 0, 2*Math.PI, false);
          ctx.stroke();



          // draw ticks
          ctx.save();
          {
            for(var i = 0; i < 180; i++) {
              if ( i%10 == 0) {
                ctx.lineWidth = 2;
                ctx.stroke(majorTick);
              } else if ( i%5 == 0) {
                ctx.lineWidth = 1;
                ctx.stroke(minorTick);
              } else {
              //  ctx.lineWidth = 0.5;
              //  ctx.stroke(subMinorTick);
              }
              ctx.rotate(Math.PI/180);
            }            
          }
          ctx.restore();
                    
          // draw the numbers
          ctx.save();
          ctx.font = '15px '+this.fontFamily;
          ctx.textAlign = 'center';
          ctx.lineWidth = 0.5;
          ctx.stroke(radial180Line);
          for(var i = 10; i < 180; i+=10) {
              ctx.rotate(10*Math.PI/180);
              ctx.fillText(i.toString(), 0, -255);
              ctx.stroke(radialSectorLine);
          }
          ctx.restore();
          ctx.save();
          ctx.font = '15px '+this.fontFamily;
          ctx.textAlign = 'center';
          for(var i = 10; i < 180; i+=10) {
              ctx.rotate(-10*Math.PI/180);
              ctx.fillText(i.toString(), 0, -255);
          }
          ctx.rotate(-10*Math.PI/180);
          ctx.fillText(180, 0, -255);
          ctx.restore();

        }
        ctx.restore(); // reset to no rotation.
        return true;
      }
    }
    return false;
  }


  // render ---------------------------------------------------------------------------------------------
  // bunch of constants first.

  render() {
    return (
      <div>
        <canvas id={this.polarId} width={this.props.width} height={this.props.height} ></canvas>
        <canvas id={this.polarRingsId} width={this.props.width} height={this.props.height} ></canvas>
        <canvas id={this.polarHistoryId} width={this.props.width} height={this.props.height} ></canvas>
      </div>
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







}

export default PolarChart;