/*jshint node:true */
"use strict";

import React from 'react';
import * as d3 from 'd3';
import utils from './utils.jsx';

// This strip chart works and scrolls smoothly, but the cost of rendering is extreemly high
// consiming at leat 50%, so I need a better way of doing this. Probably using 


class StripChart extends React.Component {
  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
        value : 0,
        title: props.title,
        units: props.units,
        historyLength: props.historyLength || 100,
        updaterate : +props.updaterate || 1000,
        damping: props.damping || 4
    };
    this.cstate = {
      timeSequence: [],
      datasets : [
        {
          color: 'orange',
          data: []
        },
        {
          color: 'green',
          data: []
        },
        {
          color: 'blue',
          data: []
        },
      ]
    };
    this.n = 0;
    this.dstate = {};
    this.props = {};
    this.setProps(props);
    this.props = props;
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
  }

  static getDefaultProperties(app,  newTab, width, height) {
    var widgetWidth = ((newTab.width/newTab.cols)*width)-15;
    var widgetHeight = (newTab.rowHeight)*height+15;
    return {
        updaterate: 1000,
        historyLength: 100,
        width: widgetWidth,
        height: widgetHeight,
        damping: 2,
        dataPath: app.sourceId+".navigation.speedThroughWater",
        units: "kn",
        title: "stw"
    }
  }

  static generateComponent(props, app) {
    return (
        <StripChart  
          updaterate={props.updaterate}
          dataPath={props.dataPath}
          units={props.units}
          title={props.title}
          width={props.width}
          height={props.height}
          damping={props.damping}
          historyLength={props.historyLength}
          app={app}  />
        );
  }

  setProps(props) {
    this.setPaths(this.props);

  }

  setPaths(props) {
    if ( this.dataStream === undefined ||  this.dataPath === undefined || props.dataPath !== this.dataPath) {
      this.dataPath = props.dataPath || this.app.sourceId+".navigation.speedThroughWater";
      console.log("Setting path ", this.dataPath);
      this.dataStream = this.app.stats.addPath(this.dataPath);      
    }
  }


  componentWillReceiveProps(nextProps) {
    var newState = {};
    var update = false;
    for(var k in this.state) {
      if ( nextProps[k] !== undefined && this.state[k] !== nextProps[k]) {
        var type = typeof this.state[k];
        console.log("Prop Change ", { from: this.state[k], to: nextProps[k], allNewProps:nextProps, type:type});
        if ( typeof this.state[k] === 'number') {
          newState[k] = +nextProps[k];
        } else {
          newState[k] = nextProps[k];
        }
        update = true;
      }
    }
    this.setProps(nextProps);
    if ( update ) {
        console.log("Setting State", { old: this.stat, newState: newState});
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






  update() {
    this.cstate.timeSequence.push(new Date());
    while ( this.cstate.timeSequence.length > this.state.historyLength) {
      this.cstate.timeSequence.shift();
    }
    for (var i = 0; i < this.cstate.datasets.length; i++) {
      if ( i == 0) {
        this.n++;
        if ( this.n%10 === 0 ) {
          this.cstate.datasets[i].data.push(20);
        } else {
          this.cstate.datasets[i].data.push(10);          
        }
      } else {
        this.cstate.datasets[i].data.push(20 + Math.random() * 100);
      }
      while ( this.cstate.datasets[i].data.length > this.state.historyLength) {
        this.cstate.datasets[i].data.shift();
      }
    };
    if (this.bound ) {
      this.draw();
    }
    setTimeout(this.update, this.state.updaterate);
  }


  draw() {
    if (this.bound ) {

      var save = this.drawChart(); 
      if ( save ) {
        utils.saveDrawState(this.cstate, this.dstate);
      }
    }
  }

  clearArea( ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }



  drawAxis(ctx, scale, xaxis, width, height, n, color) {
    var majorTicks = scale.ticks(10);
    var minorTicks = scale.ticks(20);
    var subMinorTicks = scale.ticks(100);
    ctx.beginPath();
    var offset = width+(n)*25;
    if (xaxis) {
      ctx.moveTo(0,height);
      ctx.lineTo(width,height);      
    } else {
      ctx.moveTo(offset,height);
      ctx.lineTo(offset,0);      
    }
    for (var i = 0; i < majorTicks.length; i++) {
      var tx = scale(majorTicks[i]);
      if ( xaxis ) {
        ctx.moveTo(tx,height);
        ctx.lineTo(tx,height-5);
      } else {
        ctx.moveTo(offset+0,tx);
        ctx.lineTo(offset+5,tx);
      }
    };
    for (var i = 0; i < minorTicks.length; i++) {
      var tx = scale(minorTicks[i]);
      if ( xaxis ) {
        ctx.moveTo(tx,height-0);
        ctx.lineTo(tx,height-2);
      } else {
        ctx.moveTo(offset+0,tx);
        ctx.lineTo(offset+2,tx);
      }
    };
    for (var i = 0; i < subMinorTicks.length; i++) {
      var tx = scale(subMinorTicks[i]);
      if ( xaxis ) {
        ctx.moveTo(tx,height-0);
        ctx.lineTo(tx,height-1);
      } else {
        ctx.moveTo(offset+0,tx);
        ctx.lineTo(offset+1,tx);
      }
    };
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = '10px '+this.fontFamily;
    ctx.textAlign = 'left';
    var formater = scale.tickFormat(10);

    for (var i = 0; i < majorTicks.length; i++) {
      var tx = scale(majorTicks[i]);
      if ( xaxis ) {
        ctx.fillText(formater(majorTicks[i]), tx, height-7);
      } else {
        ctx.fillText(formater(majorTicks[i]), offset+7, tx);
      }
    };
  }


  drawChart() {
    var redrawData = utils.getRedrawData(this.cstate, 
      this.dstate,
      this.significance, 
      [ "timeSequence"   ]);
    if ( redrawData !== undefined ) {
      var canvas = this.canvas;
      if (canvas !== null && canvas.getContext ) {

        var ctx = canvas.getContext('2d');
        this.clearArea(ctx, canvas);
        ctx.save();

        var width = canvas.width-(25*redrawData.datasets.length);
        var height = canvas.height;

        //draw the x axis
        // function
        var t = redrawData.timeSequence;
        var extents = d3.extent(t);
        extents[0] = new Date(extents[1].getTime()-(this.state.historyLength*this.state.updaterate));
        var x = d3.scaleTime()
            .domain(extents)
            .range([0, width]);

        this.drawAxis(ctx, x, true, width, height, 0, "black");


        for (var i = 0; i < redrawData.datasets.length; i++) {

          var group = redrawData.datasets[i];
          var y = d3.scaleLinear()
              .domain(d3.extent(group.data))
              .range([height, 0]);

          this.drawAxis(ctx, y, false, width, height, i, group.color);

          ctx.beginPath();

          d3.line()
              .curve(d3.curveBasis)
              .x(function(d, i) {
                  return x(t[i])
              })
              .y(function(d) {
                  return y(d)
              })
              .context(ctx)(group.data);
          ctx.lineWidth = 1;
          ctx.strokeStyle = group.color;
          ctx.stroke();

        }
        ctx.restore();
      }
    }
  }


  render() {
    return (
      <canvas ref={node => this.canvas = node} width={this.props.width} height={this.props.height} />
      );
  }

}

export default StripChart;