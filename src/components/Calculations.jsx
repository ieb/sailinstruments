/*jshint node:true */
"use strict";

import React from 'react';
import Bacon from 'baconjs';
import cogMagnetic from './calcs/cogMagnetic.js';
import groundWind from './calcs/groundWind.js';
import performance from './calcs/performance.js';
import trueWind from './calcs/trueWind.js';
import vmg from './calcs/vmg.js';

/**
 * this class allows claculations on derived data reducing the data that the server needs to supply.
 * and allowing in browser configuration.
 */
class Calculations extends React.Component {


  constructor(props) {
    super(props);
    this.props = props;
    this.calculations = [
      cogMagnetic(),
      groundWind(),
      trueWind(),
      performance(),
      vmg()
    ];
    this.unsubscribes = [];
  }




  componentDidMount() {
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
            // build an array of args based on the list of derivedFrom.
            return self.props.databus.getBusForSourcePath(self.props.sourceId,path);
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
              self.props.databus.push(self.props.sourceId, pathValue);
            });
          });

  }

  componentWillUnmount() {
    this.unsubscribes.forEach(f => f());
  }

  render() {
    return (
      <div></div>
    );
  }

}

export default Calculations;