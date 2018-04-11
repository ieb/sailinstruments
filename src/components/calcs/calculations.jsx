/*jshint node:true */
"use strict";

import React from 'react';
import Bacon from 'baconjs';
import cogMagnetic from './cogMagnetic.js';
import groundWind from './groundWind.js';
import performance from './performance.js';
import trueWind from './trueWind.js';
import vmg from './vmg.js';

/**
 * this class allows claculations on derived data reducing the data that the server needs to supply.
 * and allowing in browser configuration.
 */
class Calculations  {


  constructor(databus, polar) {
    this.databus = databus;
    // so that we can get access outside.
    this.polarPerformance = performance(polar);
    this.calculations = [
      cogMagnetic(),
      groundWind(),
      trueWind(),
      this.polarPerformance,
      vmg()
    ];
    this.unsubscribes = [];
    this.connect();
  }

  connect() {
    var self = this;
    this.calculations.forEach(calculation => {    
      if ( calculation.init ) {
        calculation.init();
      }
      calculation.ttl = 5000;  
      self.unsubscribes.push(self.subscribe(calculation));
    });
  }



  subscribe(calculation) {
    var self = this;
    return Bacon.combineWith(
          calculation.calculator,
          calculation.derivedFrom.map(function(path) {
            // this is problematic. 
            // when there are no streams present, the code has no idea what the source will be
            // so the getpreferredSource will be _auto, but nothing connects to that.
            // so nothing arrives here. The solution is to use a catch all that gets the data
            // for the path, based on preference, ignoring the sourceId, and locks that to that sourceId.
            // TODO: look at how many events are comming off the buss and 
            var bus = self.databus.getBusForSourcePath("_preferred", path);
            return bus;
          })
        ).changes()
        .debounceImmediate(100)
        .skipDuplicates(function(before,after) {
            var tnow = (new Date()).getTime();
            if ( _.isEqual(before,after) ) {
              // values are equial, but should we emit the delta anyway.
              // This protects from a sequence of changes that produce no change from
              // generating events, but ensures events are still generated at 
              // a default rate. On  Pi Zero W, the extra cycles reduce power consumption.
              if ( calculation.nextOutput > tnow ) {
                //console.log("Rejected dupilate ", calculation.nextOutput - tnow);
                return true;
              }
              //console.log("Sent dupilate ", calculation.nextOutput - tnow);
            }
            calculation.nextOutput = tnow+calculation.ttl;
            // console.log("New Value ----------------------------- ", before, after);
            return false;
          })
          .onValue(values => {
            // push the output back onto the bus.
            values.forEach(function(pathValue) {
              self.databus.push("calculated", pathValue);
            });
          });

  }

  disconnect() {
    this.unsubscribes.forEach(f => f());
  }


}

export default Calculations;