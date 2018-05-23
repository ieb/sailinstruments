/*jshint node:true */
"use strict";

const debug = require('debug')('signalk-derived-data')

module.exports = function() {

  return {
    group: 'environment',
    optionKey: 'leeway',
    title: "Leeway from roll and stw",
    derivedFrom: [ "navigation.attitude", "navigation.speedThroughWater"],
    calculator: function(attitude, stw) {

      //console.log("Got Data", attitude, stw);

      // This comes from Pedrick see http://www.sname.org/HigherLogic/System/DownloadDocumentFile.ashx?DocumentFileKey=5d932796-f926-4262-88f4-aaca17789bb0
      // for aws < 30 and awa < 90. UK  =15 for masthead and 5 for fractional

      var leeway = 0.0;
      var kfactor = 5;
      // roll needs a very long term average to be used for leeway.

      if ( attitude.roll !== undefined &&  stw > 0.5) {
        leeway = kfactor * attitude.roll / (stw * stw);
      }

      //console.log("Leeway is", { leeway: leeway, attitude: attitude, stw: stw});


      return [
        { path: "performance.leeway", value: leeway}
      ]
    }
  };
}
