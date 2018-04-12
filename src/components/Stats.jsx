/*jshint node:true */
"use strict";

import utils from './utils.jsx';
import units from './units.js';




class Stats  {

  /**
   * props.historyTime, length of history in ms.
   * props.historyPeriod, frequency of samples.
   * props.app the app
   * prop.streams the streams to record.
   * All values are SI units.
   */
  constructor(props) {
    this.props = props;
    this.app = props.app;
    this.historyRate = props.period || 1000;
    this.setHistoryPeriod(props.historyTime);
    this.valueStreams = {};
    this.defaultIRRCalculator = this.defaultIRRCalculator.bind(this);
    this.defaultValueCalculator = this.defaultValueCalculator.bind(this);
    this.iirRadRelative = this.iirRadRelative.bind(this);
    this.iirRadAbs = this.iirRadAbs.bind(this);
    this.iirNone = this.iirNone.bind(this);
    this.getDateTimeValue = this.getDateTimeValue.bind(this);
    this.getPositionValue = this.getPositionValue.bind(this);
    // there isnt anything in the schema that will tell use the 
    // min max of a field, so this have to be done here.
    this.iirCalculators = {
        "navigation.magneticVariation" : this.iirRadRelative,
        "performance.targetAngle" : this.iirRadRelative,
        "environment.wind.angleTrueWater" : this.iirRadRelative,
        "environment.wind.angleApparent" : this.iirRadRelative,
        "environment.wind.angleTrue" : this.iirRadRelative,
        "rad": this.iirRadAbs,
        "datetime": this.iirNone,
        "position": this.iirNone
    }

    this.valueCalculators = {
        "datetime": this.getDateTimeValue,
        "position": this.getPositionValue
    }



    var self = this;
    setInterval(() => {
      self.updateHistory();
    }, self.historyRate || 1000);
  }

  setHistoryPeriod( time) {
    this.historyLength = Math.round(time/this.historyRate);
  }

  getSourceId(path) {
    if (path.charAt(0) === '.') {
      return "_preferred"+path.substring(1);
    } else {
      return path.split('.')[0];
    }
  }
  getPath(path) {
    return path.split('.').slice(1).join(".");
  }

  getCalcIIR(paramPath) {
    if ( this.iirCalculators[paramPath] !== undefined ) {
      return this.iirCalculators[paramPath];
    }
    var unit = units.getUnitForPath(paramPath);
    if ( this.iirCalculators[unit] !== undefined) {
      return this.iirCalculators[unit];
    }
    return this.defaultIRRCalculator;
  }

  getCalcValue(paramPath) {
    if ( this.valueCalculators[paramPath] !== undefined ) {
      return this.valueCalculators[paramPath];
    }
    var unit = units.getUnitForPath(paramPath);
    console.log({ paramPath: paramPath, unit: unit});
    if ( this.valueCalculators[unit] !== undefined) {
      return this.valueCalculators[unit];
    }
    return this.defaultValueCalculator;

  }

  defaultValueCalculator(v) {
    return v;
  }

  // v is the accumulator in the same raw units.
  defaultIRRCalculator(v,c,d) {
    return utils.iir(v,c,d);
  }

  iirRadRelative(v,c,d) {
    return utils.iirRad(v,c,d,-Math.PI, Math.PI);
  }
  iirRadAbs(v,c,d) {
    return utils.iirRad(v,c,d,0, 2*Math.PI);
  }
  iirNone(v,c,d) {
    return c;
  }

  getPositionValue(v) {
    console.log(typeof v, v);
    return v;
  }
  getDateTimeValue(v) {
    console.log(typeof v, v);
    return v;
  }



  addPath(path, withHistory) {
    var sourceId = this.getSourceId(path);
    var paramPath = this.getPath(path);
    if ( this.valueStreams[path] === undefined) {
      var h = undefined;
      if (withHistory) {
        h = [];
      }
      var calcIIR = this.getCalcIIR(paramPath);
      var calcValue = this.getCalcValue(paramPath);
      var vs = this.valueStreams[path] = {
        sourceId: sourceId,
        paramPath: paramPath,
        value: 0,
        calcIIRF: calcIIR,
        calcValueF: calcValue,
        calcIIR: (v,d) => {
            return calcIIR(v, vs.value, d);
        },
        update: (v) => {
          vs.value = calcValue(v);
        },
        history: h
      };
      utils.resolve( [this.valueStreams[path]], this.app.databus);
      utils.subscribe([this.valueStreams[path] ], this);
    } else if ( withHistory ) {
      if ( this.valueStreams[path].history  === undefined ) {
        this.valueStreams[path].history = [];
      }
    }
    console.log("Added path ", path);
    return this.valueStreams[path];
  }

  updateHistory() {
    for (var i in  this.valueStreams) {
      var vs = this.valueStreams[i];
      if ( vs.history !== undefined ) {
        vs.history.unshift(vs.value);
        while (vs.history.length > this.historyLength ) {
          vs.history.pop();
        }        
      }
    }
  }

}

export default Stats;