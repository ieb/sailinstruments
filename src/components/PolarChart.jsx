/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx'
import Qty  from 'js-quantities';
import _ from "lodash";


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
      updaterate: +props.updaterate || 1000,
      damping: props.damping || 4
    };

    this.cstate = {};
    this.dstate = {};
    this.fontFamily = props.fontFamily || 'sans-serif';

    instanceId++;
    this.polarId = "PolarChart"+instanceId;
    this.polarRingsId = "PolarChartRings"+instanceId;
    this.polarHistoryId = "PolarChartHistory"+instanceId;
    this.significance = {
        maxStw: utils.compareKn,
        polarCurve: utils.compareIgnore,
        stw: utils.compareMs,
        twa: utils.compareRad,
        targetSpeed: utils.compareMs,
        targetAngle: utils.compareRad,
        twaHistory: utils.compareRad,
        stwHistory: utils.compareMs,
        boatUp: utils.compareRad,
    };


    this.bound = false;
    var self = this;
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.setPaths = this.setPaths.bind(this);
    this.setPaths(props);


  }


  setPaths(props) {
    this.hdmPath = this.props.hdmPath || "_preferred.navigation.headingMagnetic";
    this.otherTackDirPath = this.props.otherTackDirPath || "calculated.performance.headingMagnetic";
    this.twsPath = this.props.twsPath || "_preferred.environment.wind.speedTrue";
    this.twaPath = this.props.twaPath || "_preferred.environment.wind.angleTrueWater";
    this.stwPath = this.props.stwPath || "_preferred.navigation.speedThroughWater";
    this.targetSpeedPath = this.props.targetSpeedPath || "calculated.performance.targetSpeed";
    this.targetAnglePath = this.props.targetAnglePath || "calculated.performance.targetAngle";

    this.hdmStream = this.app.stats.addPath(this.hdmPath);
    this.otherTackDirStream = this.app.stats.addPath(this.otherTackDirPath);
    this.twsStream = this.app.stats.addPath(this.twsPath);
    this.twaStream = this.app.stats.addPath(this.twaPath,300);
    this.stwStream = this.app.stats.addPath(this.stwPath, 300);
    this.targetSpeedStream = this.app.stats.addPath(this.targetSpeedPath);
    this.targetAngleStream = this.app.stats.addPath(this.targetAnglePath);
  }

  setProps(props) {
    this.props = props;
  }



  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps(this, nextProps);
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
      this.cstate.tws = this.twsStream.calcIIR(this.cstate.tws, this.state.damping);
      if ( this.cstate.tws < 0.01 ) {
        this.cstate.maxStw = knToMsC(2);
        this.cstate.polarCurve = [];
        this.cstate.stw = this.stwStream.value;
        this.cstate.twa = this.twaStream.value;
        this.cstate.targetSpeed = this.targetSpeedStream.value;
        this.cstate.targetAngle = this.targetAngleStream.value;
        // create a copy of the history and convert at the same time
        this.cstate.twaHistory = _.clone(this.twaStream.history);
        this.cstate.stwHistory = _.clone(this.stwStream.history);
      } else {
        var polarCurve = this.app.calculations.polarPerformance.performanceForSpeed(this.cstate.tws);
        // polarCurve is [ { tws: < rad >, stw: <m/s>}]
        // needs to be [[x,y]]
        // make the polar curve in deg, kn so the maxMin can be done
        var plot = [];
        var maxStw = 0;
        for (var i = 0; i < polarCurve.length; i++) {
          if ( polarCurve[i].stw > maxStw ) {
            maxStw = polarCurve[i].stw;
          }
        }
        // fix the max based on lookup to keep the display more stable.
        //
        if ( maxStw > this.cstate.maxStw ) {
          // must be increased
          var m = (Math.floor((msToKnC(maxStw)*1.2)/2)+1)*2;
          maxStw = knToMsC(m);
        } else if ( maxStw < this.cstate.maxStw*0.6 ) {
          // must be decreased.
          var m = (Math.floor((msToKnC(maxStw)*1.2)/2)+1)*2;
          maxStw = knToMsC(m);
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
        this.cstate.maxStw = maxStw;  // in ms
        this.cstate.polarCurve = a; // all in rad, pixels
        this.cstate.stw = this.stwStream.calcIIR(this.cstate.stw, this.state.damping); 
        this.cstate.twa = this.twaStream.calcIIR(this.cstate.twa, this.state.damping); 
        this.cstate.targetSpeed = this.targetSpeedStream.calcIIR(this.cstate.targetSpeed, this.state.damping);
        this.cstate.targetAngle = this.targetAngleStream.calcIIR(this.cstate.targetAngle, this.state.damping);
        this.cstate.twaHistory = _.clone(this.twaStream.history);
        this.cstate.stwHistory = _.clone(this.stwStream.history);
        this.cstate.polarName = this.app.calculations.polarPerformance.currentPolarUri;
        if ( this.state.headup ) {
          this.cstate.boatUp = 0;
        } else {
          this.cstate.boatUp = this.hdmStream.calcIIR(this.cstate.boatUp, this.state.damping); 
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
        utils.saveDrawState(this.cstate, this.dstate);
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
      ctx.rotate(a);
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
        ctx.rotate(-redrawData.boatUp);

        var scale = 240/redrawData.maxStw;

        ctx.save();
        var a = [];
        // the most recent is the first element
        a.push([redrawData.twa, redrawData.stw*scale]);
        for (var i = 0; i < redrawData.twaHistory.length; i++) {
          a.push([redrawData.twaHistory[i], redrawData.stwHistory[i]*scale]);
        };
        utils.drawSmoothRadialLine(ctx, a, 2, "rgb(0,255,255)");
        ctx.restore();
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

        ctx.font = '20px '+this.fontFamily;
        ctx.textAlign = 'right';
        ctx.fillStyle = "black";
        ctx.fillText(redrawData.polarName, 250, -280);

        // outer rose rotation.
        ctx.rotate(-redrawData.boatUp);



        var maxStwKn = msToKnC(redrawData.maxStw);
        var scale = 240/maxStwKn;

        var step = 2;
        if ( maxStwKn < 5 ) {
          step = 1;
        }
        ctx.font = '15px '+this.fontFamily;
        ctx.textAlign = 'center';

        for ( var i = step; i <= maxStwKn; i+= step) {
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
          ctx.rotate(-redrawData.boatUp);


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
      <div className="canvasHolder" >
        <canvas id={this.polarId} width={this.props._width} height={this.props._height} ></canvas>
        <canvas id={this.polarRingsId} width={this.props._width} height={this.props._height} ></canvas>
        <canvas id={this.polarHistoryId} width={this.props._width} height={this.props._height} ></canvas>
      </div>
    );
  }



}

export default PolarChart;