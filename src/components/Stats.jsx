/*jshint node:true */
"use strict";

import utils from './utils.js';




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
      return this.app.sourceId;
    } else {
      return path.split('.')[0];
    }
  }
  getPath(path) {
    return path.split('.').slice(1).join(".");
  }



  addPath(path, withHistory) {
    var sourceId = this.getSourceId(path);
    var paramPath = this.getPath(path);
    if ( this.valueStreams[path] === undefined) {
      var h = undefined;
      if (withHistory) {
        h = [];
      }
      var vs = this.valueStreams[path] = {
        sourceId: sourceId,
        paramPath: paramPath,
        value: 0,
        update: (v) => {
          vs.value = v;
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