/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.jsx'

/*
 * A canvas based compass roase that manages its own state.
 * This avoids adding 1000s of SVG elements to the react virtual dom and real dom that
 * will change if compass rose rotation changes.
 * Canvas redraws are about 8x faster than SVG and use less CPU. (however I didnt test react SVG, which 
 * may be able reuse previous state and only transform the roatation.)
 * In addition, the main rose and pointers are in different layers.
 */

var instanceId = 0;

class CompassRose extends React.Component {


  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
        northup: props.northup,
        updaterate: +props.updaterate || 1000,
        damping: props.damping || 4
    };
    this.cstate = {};
    this.dstate = {};
    this.fontFamily = props.fontFamily || 'sans-serif';

    instanceId++;
    this.roseId = "CompassRose"+instanceId;
    this.rosePointersId = "CompassRosePointer"+instanceId;
    this.significance = {
        oppositeTackDirection: utils.compareRad,
        groundWindDirection: utils.compareRad,
        boatUp: utils.compareRad,
        hdm: utils.compareRad
    };

    this.container = undefined;

    this.setPaths(this.props);
    this.bound = false;
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.setPaths = this.setPaths.bind(this);
  }


  setPaths(props) {
    this.gwdPath = props.gwdPath || "calculated.environment.wind.directionTrue";
    this.oppTrackDirPath = props.oppTrackDirPath || "calculated.performance.headingMagnetic";
    this.hdmPath = props.hdmPath || "_preferred.navigation.headingMagnetic";
    this.groundWindDirectionStream = this.app.stats.addPath(this.gwdPath);
    this.oppTrackDirStream = this.app.stats.addPath(this.oppTrackDirPath);
    this.hdmStream = this.app.stats.addPath(this.hdmPath);
  }

  setProps(props) {
    this.props = props;
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps( this, nextProps);
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

  update() {
    if ( this.bound ) {
      this.cstate.oppositeTackDirection = this.oppTrackDirStream.calcIIR(this.cstate.oppositeTackDirection, this.state.damping);
      this.cstate.groundWindDirection = this.groundWindDirectionStream.calcIIR(this.cstate.groundWindDirection, this.state.damping);
      this.cstate.hdm = this.hdmStream.calcIIR(this.cstate.hdm, this.state.damping);
      if ( this.state.northup ) {
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
    if ( this.bound ) {
      var save =  this.drawCompass();          
      save = this.drawCompassPointers() || save;
      if ( save ) {
        utils.saveDrawState(this.cstate, this.dstate);
      } else {
        utils.resetDrawState(this.cstate);
      }
      //var raf = window.requestAnimationFrame(this.draw);
    }

  }

  clearArea( ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }



        // outer compas rose pointers.
  drawCompassPointers() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp", "groundWindDirection" ,"oppositeTackDirection" ]);
    if ( redrawData !== undefined ) {
      var skin = utils.getSkin(redrawData);
      var canvas = document.getElementById(this.rosePointersId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');
        ctx.save();
          this.clearArea(ctx, canvas);
          ctx.strokeStyle = skin.black;
          ctx.fillStyle = skin.black;
          ctx.translate(310,310);

          // outer rose rotation.
          ctx.rotate(-redrawData.boatUp);

          this.createCompasMarker(ctx, redrawData.groundWindDirection, 'G', skin.green, skin.white, skin.black);
          this.createCompasMarker(ctx, redrawData.oppositeTackDirection, 'O', skin.black, skin.white, skin.black);

        ctx.restore();
        return true;

      }
    }
    return false;
  }

  createCompasMarker(ctx, angle, name, color, lightColor, darkColor) {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.lineStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0,-280);
    ctx.arc(0,-280,10,0,2*Math.PI,true);
    ctx.moveTo(-10,-277);
    ctx.lineTo(0,-250);
    ctx.lineTo(10,-277);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,-280);
    ctx.fillStyle = lightColor;
    ctx.arc(0,-280,8,0,2*Math.PI,true);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = darkColor;
    ctx.font = '15px '+this.fontFamily;
    ctx.fillText(name, 0, -275);
    ctx.restore();
  }


  drawCompass() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "boatUp" ]);
    if ( redrawData !== undefined ) {
      var skin = utils.getSkin(redrawData);
      var canvas = document.getElementById(this.roseId);
      if (canvas !== null && canvas.getContext ) {
        var ctx = canvas.getContext('2d');
        const crMajorTicks = new Path2D("M 0 -252 L 0 -240 M 0 240 L 0 252");
        const crMinorTicks = new Path2D("M 0 -247 L 0 -240 M 0 240 L 0 247");
        const crsubMinorTicks = new Path2D("M 0 -245 L 0 -240 M 0 240 L 0 245");


        const pointerN1 = new Path2D("M 0 -280 L -5 -240 0 -240 0 -280 M 0 260 L  5 240 0 240 0 260");  
        const pointerN2 = new Path2D("M 0 -280 L  5 -240 0 -240 0 -280 M 0 260 L -5 240 0 240 0 260");
        const pointerW1 = new Path2D("M 0 -260 L -5 -240 0 -240 0 -260 M 0 260 L  5 240 0 240 0 260");
        const pointerW2 = new Path2D("M 0 -260 L  5 -240 0 -240 0 -260 M 0 260 L -5 240 0 240 0 260");

        
        ctx.save();
        this.clearArea(ctx, canvas);
        ctx.translate(310,310);
        ctx.strokeStyle = skin.black;
        ctx.fillStyle = skin.black;

        // outer rose rotation.
        ctx.rotate(-redrawData.boatUp);


        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 240, 0, 2*Math.PI, false);
        ctx.stroke();

        for(var i = 0; i < 180; i++) {
          if ( i%10 == 0) {
            ctx.lineWidth = 1;
            ctx.stroke(crMajorTicks);
          } else if ( i%5 == 0) {
            ctx.lineWidth = 0.5;
            ctx.stroke(crMinorTicks);
          } else {
            ctx.lineWidth = 0.5;
            ctx.stroke(crsubMinorTicks);
          }
          ctx.rotate(Math.PI/180);
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = skin.black;
        ctx.lineWidth = 0.5;
        ctx.fill(pointerN1);
        ctx.stroke(pointerN2);
        ctx.rotate(Math.PI*90/180);
        ctx.fill(pointerW1);
        ctx.stroke(pointerW2);
        ctx.restore();
        
        ctx.save();
        var nlabels = {
          0: [{l:'N', p: -280, f: '28px'} ],
          90: [{l:'E', p: -285, f: '28px'}, {l:'90', p: -265, f: '20px'}],
          180: [{l:'S', p: -285, f: '28px'}, {l:'180', p: -265, f: '20px'}],
          270: [{l:'W', p: -285, f: '28px'}, {l:'270', p: -265, f: '20px'}]
        }
        ctx.textAlign = 'center';
        for(var i = 0; i < 360; i+=10) {
          if ( nlabels[i] !== undefined ) {
            for(var k in nlabels[i]) {
              ctx.font = nlabels[i][k].f+' '+this.fontFamily;
              ctx.fillText(nlabels[i][k].l, 0, nlabels[i][k].p);
            }
          } else {
            ctx.font = '15px '+this.fontFamily;                  
            ctx.fillText(i.toString(), 0, -252);
          }
          ctx.rotate(Math.PI*10/180);
        }
        ctx.restore();

        ctx.restore();
        return true;
      }
    }
    return false;
  }


  render() {
    return (
      <div className="canvasHolder" >
        <canvas id={this.roseId} width={this.props._width} height={this.props._height}></canvas>
        <canvas id={this.rosePointersId} width={this.props._width} height={this.props._height}></canvas>
      </div>
  );
  }

}

export default CompassRose;