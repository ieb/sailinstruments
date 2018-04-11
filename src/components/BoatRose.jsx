/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx';


/**
 * This is a canvas based Boat Rose with the Rose in 1layer and the markers in a seprate layer.
 * It draws with canvas and manages its own state.
 */
var instanceId = 0;
class BoatRose extends React.Component {


  constructor(props) {
    super(props);

    this.props = props;
    this.app = props.app;
    this.state = {
        headup: props.headup,
        updaterate: +props.updaterate || 1000,
        damping: props.damping || 4
    };
    this.cstate = {};
    this.dstate = {};
    this.fontFamily = props.fontFamily || 'sans-serif';
    instanceId++;
    this.roseId = "rose"+instanceId;
    this.rosePointersId = "rosePointer"+instanceId;
    console.log("New BoatRose Headup ", this.state.headup);


    var self = this;
    this.bound = false;
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.setPaths = this.setPaths.bind(this);

    this.setPaths(this.props);
    this.container = undefined;

    this.significance = {
        twaHistory: utils.compareRad,
        awaHistory: utils.compareRad,
        leewayAngle: utils.compareRad,
        awa: utils.compareRad,
        twa: utils.compareRad,
        targetAngle: utils.compareRad,
        hdm: utils.compareRad,
        boatUp: utils.compareRad
    };

  }

  setPaths(props) {
    this.leewayPath = props.leewayPath || "_preferred.performance.leeway";
    this.awaPath = props.awaPath || "_preferred.environment.wind.angleApparent";
    this.twaPath = props.twaPath || "_preferred.environment.wind.angleTrue";
    this.targetAnglePath = props.targetAnglePath || "calculated.performance.targetAngle";
    this.hdmPath = props.hdmPath || "_preferred.navigation.headingMagnetic";
    this.leewayStream = this.app.stats.addPath(this.leewayPath);
    this.awaStream = this.app.stats.addPath(this.awaPath, true);
    this.twaStream = this.app.stats.addPath(this.twaPath, true);
    this.targetAngleStream = this.app.stats.addPath(this.targetAnglePath);
    this.hdmStream = this.app.stats.addPath(this.hdmPath);    
  }

  setProps(props) {
    this.fontFamily = props.fontFamily || 'sans-serif';
    this.props = props;
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps( this, nextProps);
  }


  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;
      console.log("Bound BoatRose");
      this.update();  
      this.draw();
    
    }
  }

  componentWillUnmount() {
    this.bound = false;
    console.log("UnBound BoatRose");
  }

  update() {
    if ( this.bound ) {
      this.cstate.twaHistory = _.clone(this.twaStream.history);
      this.cstate.awaHistory = _.clone(this.awaStream.history);
      this.cstate.leewayAngle = this.leewayStream.calcIIR(this.cstate.leewayAngle, this.state.damping);
      this.cstate.awa = this.awaStream.calcIIR(this.cstate.awa, this.state.damping);
      this.cstate.twa = this.twaStream.calcIIR(this.cstate.twa, this.state.damping);
      this.cstate.targetAngle = this.targetAngleStream.calcIIR(this.cstate.targetAngle, this.state.damping);
      this.cstate.hdm = this.hdmStream.calcIIR(this.cstate.hdm, this.state.damping);
      if ( this.state.headup ) {
        this.cstate.boatUp = 0;
      } else {
        this.cstate.boatUp = this.cstate.hdm;
      }
      this.draw();
      setTimeout(this.update, this.state.updaterate);
    }
  }


  // -------------------------- rendering ----------------------------------



  draw() {
    if (this.bound ) {
      var save = this.drawRose(); 
      save = this.drawRosePointers() || save;
      if ( save ) {
        utils.saveDrawState(this.cstate, this.dstate);
      }
      // perhaps we want to control the refresh rate ?
      //var raf = window.requestAnimationFrame(this.draw);      
    }
  }


  clearArea( ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }


  drawRosePointers() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp", "twa" ,"awa", "leeway", "twaHistory", "awaHistory", "targetAngle" ]);
    if ( redrawData !== undefined ) {
      var canvas = document.getElementById(this.rosePointersId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');
        ctx.save();
          this.clearArea(ctx, canvas);
          ctx.translate(310,310);


          // outer rose rotation.
          ctx.rotate(redrawData.boatUp);

          this.createBoatMarker(ctx, redrawData.twa, 'T', 'blue', 'white', 'black');
          this.createBoatMarker(ctx, redrawData.awa, 'A', 'orange', 'white', 'black');
          this.createBoatMarker(ctx, redrawData.leeway, 'L', 'black', 'white', 'black');
          this.createRadialHistory(ctx, redrawData.twa, redrawData.twaHistory, 'blue');
          this.createRadialHistory(ctx, redrawData.awa, redrawData.awaHistory, 'orange');
          this.createPointer(ctx, redrawData.targetAngle, "v", "black", "white");
        ctx.restore();
        return true;
      }
    }
    return false;
  }

  createPointer(ctx, angle, label, darkColor, lightColor) {
    ctx.save();

    ctx.rotate(angle);
    ctx.textAlign = 'center';
    ctx.font = '15px '+this.fontFamily;
    ctx.fillStyle = darkColor;
    ctx.lineStyle = darkColor;
    ctx.lineWidth = 0.5;    
    ctx.beginPath();
    ctx.moveTo(-8,-178);
    ctx.lineTo(0,-197);
    ctx.lineTo(8,-178);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0,-175)
    ctx.arc(0,-175,8,0,2*Math.PI,true);
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(0,-175)
    ctx.arc(0,-175,7,0,2*Math.PI,true);
    ctx.fillStyle = lightColor;
    ctx.fill();
    ctx.fillStyle = darkColor;
    ctx.fillText(label,0,-170);
    ctx.restore();
  }

  createBoatMarker(ctx, angle, name, color, lightColor, darkColor) {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.lineStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0,-225);
    ctx.arc(0,-225,10,0,2*Math.PI,true);
    ctx.moveTo(-10,-222);
    ctx.lineTo(0,-200);
    ctx.lineTo(10,-222);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,-225);
    ctx.fillStyle = lightColor;
    ctx.arc(0,-225,8,0,2*Math.PI,true);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = darkColor;
    ctx.font = '15px '+this.fontFamily;
    ctx.fillText(name, 0, -220);

    ctx.restore();
  }



  createRadialHistory(ctx, c, history, color) {
    let a = [];
    // the most recent is the first element
    a.push([ c-Math.PI, -200]);      
    for (let i = 0; i < history.length-1; i++) { 
       a.push([ history[i]-Math.PI, -200+(i*(200/history.length))]);
    };
    utils.drawSmoothRadialLine(ctx, a, 1, color);
  }






  drawRose() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp" ]);
    if ( redrawData !== undefined ) {
      var canvas = document.getElementById(this.roseId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');

        const majorTick = new Path2D("M 0 -200 L 0 -182 M 0 182 L 0 200");
        const minorTick = new Path2D("M 0 -200 L 0 -185 M 0 185 L 0 200");
        const subMinorTick = new Path2D("M 0 -200 L 0 -190 M 0 190 L 0 200");
        const fineTick = new Path2D("M 0 -200 L 0 -194 M 0 194 L 0 200");
        const starboardSector = new Path2D("M 0 -185 a 185 185 0 0 1 160.21469970012114 92.50000000000001");
        const portSector = new Path2D("M 0 -185 a 185 185 0 0 0 -160.21469970012114 92.50000000000001");

        const boatPort = new Path2D("M 0 -100 A 80,130 0 0,0 -20,60 L 0,60");
        const boatStarboard = new Path2D("M 0 -100 A 80,130 0 0,1 20,60 L 0,60");

        ctx.save();
        {
          this.clearArea(ctx, canvas);
          ctx.translate(310,310);

          // outer rose rotation.
          ctx.rotate(redrawData.boatUp);


          // draw sectors
          ctx.save();
          {
            ctx.lineWidth = 30;
            ctx.strokeStyle = 'red';
            ctx.stroke(portSector);
            ctx.strokeStyle = 'green';
            ctx.stroke(starboardSector);            
          }
          ctx.restore();

          // boat shape.
          ctx.save();
          {
            ctx.fillStyle = 'red';
            ctx.fill(boatPort);
            ctx.fillStyle = 'green';
            ctx.fill(boatStarboard);            
          }
          ctx.restore();



          // draw ticks
          ctx.save();
          {
            ctx.font = '28px '+this.fontFamily;
            ctx.textAlign = 'center';
            for(var i = 0; i < 180; i++) {
              if ( i%30 == 0) {
                ctx.lineWidth = 2;
                ctx.stroke(majorTick);
              } else if ( i%10 == 0) {
                ctx.lineWidth = 1;
                ctx.stroke(minorTick);
              } else if ( i%5 == 0) {
                ctx.lineWidth = 0.5;
                ctx.stroke(subMinorTick);
              } else if ( i < 40 || i > 140) {
                ctx.lineWidth = 0.5;
                ctx.stroke(fineTick);
              }
              if (i != 0 &&  i%30 == 0 ) {
                ctx.fillText(i.toString(), 0, -145);
              }
              ctx.rotate(Math.PI/180);
            }            
          }
          ctx.restore();
          
          // draw numbers
          ctx.save();
          {
            ctx.font = '28px '+this.fontFamily;
            ctx.textAlign = 'center';
            for(var i = 30; i < 180; i+=30) {
                ctx.rotate(-Math.PI*30/180);
                ctx.fillText(-i.toString(), 0, -145);
            }
          }
          ctx.restore();
          
          ctx.save();
          {
            ctx.font = '28px '+this.fontFamily;
            ctx.textAlign = 'center';
            ctx.rotate(Math.PI);
            ctx.fillText("180", 0, -145);
          }
          ctx.restore();


        }
        ctx.restore(); // reset to no rotation.
        return true;
      }
    }
    return false;
  }


  render() {
    return (
      <div className="canvasHolder"  >
        <canvas id={this.roseId} width={this.props.width} height={this.props.height}></canvas>
        <canvas id={this.rosePointersId} width={this.props.width} height={this.props.height}></canvas>
      </div>
    );
  }

}

export default BoatRose;