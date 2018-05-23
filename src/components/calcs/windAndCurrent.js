/*jshint node:true */
"use strict";

const debug = require('debug')('signalk-derived-data')

module.exports = function() {

  function fixDirection(d) {
    if ( d > Math.PI*2) {
      d = d - Math.PI*2;
    } else if ( d < 0) {
      d = d+ Math.PI*2;
    }
    return d;
  }
  function calcDirectionAndSpeed(hdm, hdt, v) {
    var a = Math.atan2(v[1], v[0]);
    var m = fixDirection(hdm+a);
    var t = fixDirection(hdt+a);
    var s = Math.sqrt(v[0]*v[0]+v[1]*v[1]);
    return {
      angle: a,
      dirTrue: t,
      dirMag: m,
      speed: s
    };
  }
  return {
    group: 'environment',
    optionKey: 'windAndCurrent',
    title: "Wind and Current (based on HDT, COGT, deviation, SOG, AWA and AWS)",
    derivedFrom: [ "navigation.headingTrue", 
      "navigation.courseOverGroundTrue", 
      "navigation.magneticVariation", 
      "navigation.speedOverGround",
      "navigation.speedThroughWater",  
      "environment.wind.speedApparent", 
      "environment.wind.angleApparent" ],
    calculator: function(hdt, cogt, dev, sog, stw, aws, awa) {
      // 

      // calculate the angle of drift. cog and hdm are magnetic
      // this is the angle between heading and cog which is the sum of tide and leeway.
      var driftAngle = hdt-cogt;
      // ensure relative in the range +PI to -PI, although tbh this is probably not necessary as its used in cos/sin.
      if ( driftAngle > Math.PI) {
        driftAngle = driftAngle - Math.PI*2;
      } else if ( driftAngle < -Math.PI ) {
        driftAngle = driftAngle + Math.PI*2;
      }
      // all vectors are relative to the center line of the boat, with [0] being fore aft and [1] being on the beam.
      // aparent sog/cog
      var asogV = [ Math.cos(driftAngle) * sog, Math.sin(driftAngle) * sog];
      // aparent wind
      var awaV = [ Math.cos(awa) * aws, Math.sin(awa) * aws];
      // leewayV, it could be argued that this impacts twa and tws, depending on 
      // what you view twa and tws being relative to. Here leeway does not
      // impact twa and tws.
      // Since asogV is relative to the boat and claculated using the difference
      // of hdm and cog 
      // Not using leeway as that depends on heal and hence is better calculated
      // seperately.
      // var aleewayV = [ Math.cos(leeway) * stw, Math.sin(leeway) * stw];


      // stw is already aparent
      // this assumes that the speed sensor measures no sideways velocity.
      var stwV = [ stw, 0];

      // awaV-asogV = agwdV  aparent ground wind vector
      var agwdV = [ awaV[0]-asogV[0], awaV[1]-asogV[1]];

      // acurrentV = asogV-stwV ie when the boat is stationary, aparent current vector.
      var acurrentV = [ asogV[0]-stwV[0], asogV[1] - stwV[1]];
      var hdm = fixDirection(hdt+dev);
      var cogm = fixDirection(cogt+dev);
      var gwind= calcDirectionAndSpeed(hdt,hdm, agwdV);
      var current= calcDirectionAndSpeed(hdt,hdm, acurrentV);

      // it is possible that the paths used here are not structly SignalK, however at the time of writing
      // there were inconsistencies. The paths here are as concise and precise as possible for use witing 
      // the app, none are published.

            // these vectors are releative to the boat, with [0] being fore/aft, and [1] being starboard/port.

      // subtract the water vector to get the true vector.
      var trueWindV = [awaV[0]-stwV[0], awaV[1]-stwV[1]];
      // convert to angular co-ordinates.
      var trueWind = calcDirectionAndSpeed(hdt, hdm, trueWindV);
      
      // it is possible that the paths used here are not structly SignalK, however at the time of writing
      // there were inconsistencies. The paths here are as concise and precise as possible for use witing 
      // the app, none are published.


      return [{ path: "environment.wind.directionTrue", value: gwind.dirTrue},
              { path: "environment.wind.directionMagnetic", value: gwind.dirMag},
              { path: "environment.wind.speedGround", value: gwind.speed},
              { path: "environment.wind.angleGround", value: gwind.angle},
              { path: "environment.current.drift", value: current.speed},
              { path: "environment.current.setMagnetic", value: current.dirMag},
              { path: "environment.current.setTrue", value: current.dirTrue},
              { path: "navigation.courseOverGroundMagnetic", value: cogm}
              ]
    }
  };
}
