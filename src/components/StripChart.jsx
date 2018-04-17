/*jshint node:true */
"use strict";

import React from 'react';
import * as d3 from 'd3';
import utils from './utils.jsx';
import units from './units.jsx';
import _ from "lodash";
import StripChartConfigure from "./StripChartConfigure.jsx";

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
    this.dstate = {};
    this.cstate = {};
    this.setProps(props);
    this.props = props;
    this.update = this.update.bind(this);
    this.setProps = this.setProps.bind(this);
    this.draw = this.draw.bind(this);
  }

  static updateDefaultProperties(app, newTab, layout) {
    StripChart.updateLayoutContents(app, newTab, layout);
    layout.contents.formRender = StripChart.formRender;
    _.defaults(layout.contents.props,{
        updaterate: 1000,
        historyLength: 100,
        damping: 2,
        datasets: [
          {
            color: 'orange',
            fill: false,
            enabled: true,
            zerobase: false,
            path: "_prefered.navigation.speedThroughWater"
          },
          {
            color: 'green',
            fill: false,
            enabled: false,
            zerobase: false,
            path: "_prefered.navigation.speedThroughWater"
          },
          {
            color: 'blue',
            fill: false,
            enabled: false,
            zerobase: false,
            path: "_prefered.navigation.speedThroughWater"
          }
        ]           
    });
  }

  static updateLayoutContents(app, newTab, layout) {
    layout.contents.props.width = ((newTab.width/newTab.cols)*layout.w)-15;
    layout.contents.props.height = (newTab.rowHeight)*layout.h+15;
  }


  static generateComponent(props, app) {
    return (
        <StripChart  
          updaterate={props.updaterate}
          units={props.units}
          title={props.title}
          width={props.width}
          height={props.height}
          damping={props.damping}
          datasets={props.datasets}
          historyLength={props.historyLength}
          app={app}  />
        );

  }

  // return form content.
  static formRender(configureCell, state) {
    console.log("calling form render");
    return (
        <StripChartConfigure configureCell={configureCell} state={state} />
      );
  }

  setProps(props) {
    this.cstate = this.cstate || {};
    _.defaults(this.cstate,{
      timeSequence: [],
      datasets: [
      ]
    });

    for (var i = 0; i < props.datasets.length; i++) {
      var group = this.cstate.datasets[i] = this.cstate.datasets[i] || {
          color: "orange", 
          enabled:false,
          fill:false,
          path:"nmeaFromFile.environment.wind.speedApparent",
          data: []        
      };
      _.merge(group, props.datasets[i]);
      if ( group.enabled) {
        group.dataStream = this.app.stats.addPath(group.path, this.state.historyLength);
        console.log("Attached to ",group.path);
      }
      console.log("Final group", group);
    };

  }


  componentWillReceiveProps(nextProps) {
    console.log("New props ",  nextProps);
    utils.componentWillReceiveProps(this, nextProps);
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
    if (this.bound ) {
      var l = 0;
      for (var i = 0; i < this.cstate.datasets.length; i++) {
        var group = this.cstate.datasets[i];
        if ( group.enabled) {
          l = Math.max(l, group.dataStream.history.length);
        }
      }
      l = Math.min(this.state.historyLength, l);
      if ( l > 0 ) {
        for (var i = 0; i < this.cstate.datasets.length; i++) {
          var group = this.cstate.datasets[i];
          if ( group.enabled) {
            var ds = group.dataStream.history.slice(0,Math.min(l,group.dataStream.history.length));
            var mean = _.mean(ds);
            // convert the data.
            // find the mean value first, then use that to get the display data.
            group.display = units.displayForFullPath(mean, group.path);

            // the dataset may be partial and started from later than others, so 
            // save as much as possible, defaulting the remainder to the earliest 
            // known value
            group.data = [];
            for (var j = 0; j < ds.length; j++) {
              group.data.push(group.display.conversion(ds[j]));
            }
            for (var j = ds.length; j < l; j++) {
              group.data.push(group.data[ds.length-1]);
            }
            // reverse the order for drawing.
            group.data = group.data.reverse();
            if ( group.display.units === 'deg') {
              group.extent = this.degAveraged(group.data);
              group.curcular = true;
            } else {
              group.extent = this.defaultExtent(group.data, group.zerobase);
            }
          }
        };
        this.cstate.timeSequence = this.app.stats.historyTime.slice(0,l).reverse();

        this.draw();        
      }
      setTimeout(this.update, this.state.updaterate);
    }
  }


  degAveraged(dataset) {
    // perform a circular mean.
    var sinMean = 0;
    var cosMean = 0;
    var clamp = [0,360,360];
    var relativeclamp = [-180, 180, 360];
    for (var i = 0; i < dataset.length; i++) {
      if (dataset[i] < 0) {
        clamp = relativeclamp;
        dataset[i] = dataset[i]+360;
      }
      sinMean = sinMean + Math.sin(dataset[i]*Math.PI/180);
      cosMean = cosMean + Math.cos(dataset[i]*Math.PI/180);
    };
    sinMean = sinMean/dataset.length;
    cosMean = cosMean/dataset.length;
    var mean = Math.atan2(sinMean, cosMean)*180/Math.PI;
    mean = Math.trunc(mean/10)*10
    if ( mean < 0 ) {
      mean = mean + 360;
    }
    // shift all the values to center on the mean.
    for (var i = 0; i < dataset.length; i++) {
      dataset[i] = dataset[i] - mean;
      if ( dataset[i] < -180 ) {
        dataset[i] = dataset[i] + 360;
      }
      if ( dataset[i] > 180 ) {
        dataset[i] = dataset[i] - 360;
      }
    };
    var min = _.min(dataset);
    var max = _.max(dataset);

    min = (Math.trunc(min/5)-1)*5;
    max = (Math.trunc(max/5)+1)*5;
    return {  extents: [min, max], offset: mean, clamp: clamp };    
  }

  degExtent(dataset) {
    // perform a circular mean.
    var sinMean = 0;
    var cosMean = 0;
    for (var i = 0; i < dataset.length; i++) {
      if (dataset[i] < 0) {
        dataset[i] = dataset[i]+360;
      }
      sinMean = sinMean + Math.sin(dataset[i]*Math.PI/180);
      cosMean = cosMean + Math.cos(dataset[i]*Math.PI/180);
    };
    sinMean = sinMean/dataset.length;
    cosMean = cosMean/dataset.length;
    var mean = Math.atan2(sinMean, cosMean)*180/Math.PI;
    // find the extents.
    var min = _.min(dataset);
    var max = _.max(dataset);
    if ( mean < 0 ) {
      mean = mean+360;
    }

    // all is in the range 0 - 360, if min < mean < max, then the mean is between the values.
    if ( min < mean && mean < max ) {
      return { extents: [min, max], offset: 0, clamp: [ 0, 360, 360 ]};
    } else {
      // mean is outside the values which effectively makes the max the min and the min the max.
      // the range and dataset will now go from a negative degree to +ve degree.
      // when rendering, the numbers of the scale must be adjusted to make sense depending on 
      // if this is relative or absolute.
      for (var i = 0; i < dataset.length; i++) {
        if ( dataset[i] > max ) {
          dataset[i] = dataset[i]-360;
        }
      };
      max = max-360; 
      return { extents: [max, min], offset: 0, clamp: [ 0, 360, 360 ] };
    }

  }

  range(v,d) {
    var base = 1;
    // max should be rounded up
    for ( var i = 0; i < 10; i++) {
      if ( v < (30*base) ) {
        // round up to the next even.
        return (Math.trunc(v/(2*base))+d)*(2*base);
      } else if ( v < (50*base) ) {
        // round up to the next 10.
        return (Math.trunc(v/(10*base))+d)*(10*base);
      }
      base = base*10;
    }
    return (Math.trunc(v/(2*base))+d)*(2*base);
  }

    // the dataset is in the converted form
  // it is assumed to be linear and will be 0 based.
  defaultExtent(dataset, zerobase) {
    var min = _.min(dataset);
    if ( zerobase && min > 0 ) {
      min = 0;
    } else {
      var rmin = this.range(Math.abs(min),-1);
      if (min < 0) {
        min = -rmin;
      } else {
        min = rmin;
      }
    }
    var max = _.max(dataset);
    var rmax = this.range(Math.abs(max),1);
    if ( max < 0 ) {
      max = -rmax;
    } else {
      max = rmax;
    }
    return  { extents: [min, max], offset: 0 };
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



  drawAxis(ctx, scale, xaxis, width, height, n, color, extent) {
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
      var v = majorTicks[i];
      if ( extent != undefined ) {
        if ( extent.offset !== undefined ) {
          v = v + extent.offset;
        }
        if ( extent.clamp !== undefined ) {
          if ( v < extent.clamp[0]) {
            v = v + extent.clamp[2];
          }
          if ( v > extent.clamp[1]) {
            v = v - extent.clamp[2];
          }
        }
      }
      if ( xaxis ) {
        ctx.fillText(formater(v), tx, height-7);
      } else {
        ctx.fillText(formater(v), offset+7, tx);
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
        var tmin = extents[0];
        extents[0] = new Date(extents[1].getTime()-(this.state.historyLength*this.state.updaterate));
        var x = d3.scaleTime()
            .domain(extents)
            .range([0, width]);

        this.drawAxis(ctx, x, true, width, height, 0, "black");


        for (var i = 0; i < redrawData.datasets.length; i++) {
          var group = redrawData.datasets[i];
          if ( group.enabled) {


            var y = d3.scaleLinear()
                .domain(group.extent.extents)
                .range([height, 0]);

            this.drawAxis(ctx, y, false, width, height, i, group.color, group.extent);

            ctx.beginPath();

  // d3.curveBasis

            d3.line()
                .curve(d3.curveMonotoneX)
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
            if ( group.fill ) {
              ctx.lineTo(width, height);
              ctx.lineTo(x(tmin), height);
              ctx.closePath();
              ctx.fillStyle = group.color;
              ctx.globalAlpha = 0.2;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            if ( group.display !== undefined ) {
              ctx.font = '15px '+this.fontFamily;
              ctx.textAlign = 'left';
              ctx.fillText(group.display.title, 5, 15+25*i);
            }



          }          
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