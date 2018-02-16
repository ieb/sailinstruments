/*jshint node:true */
"use strict";




(module.exports = function() {

  const Qty  = require('js-quantities');

  const radToDeg = Qty.swiftConverter('rad', 'deg')
  const msToKnC = Qty.swiftConverter('m/s', 'kn');


  var resolve = function(valueStreams, databus) {
      for (var i in  valueStreams) {
        valueStreams[i].stream = databus.getStreamForSourcePath(valueStreams[i].sourceId,valueStreams[i].path);
      };
  }

  function subscribeStream(vs) {
    vs.unsubscribe = vs.stream.onValue(vs.update);        
  }

  var subscribe = function(valueStreams){
    for (var i in  valueStreams) {
      if (valueStreams[i].stream !== undefined) {
        subscribeStream(valueStreams[i]);
      } else {
        console.log("Warning, no value stream ", valueStreams[i]);
      }
    }
  }



  var unsubscribe = function( valueStreams) {
    for (var i in  valueStreams) {
      if (valueStreams[i].unsubscribe !== undefined) {
        valueStreams[i].unsubscribe();
        valueStreams[i].unsubscribe = undefined;
      }
    }
  }

  var convertDegA = function(a) {
    var ad = [];
    for (var i = a.length - 1; i >= 0; i--) {
      ad.push(+(radToDeg(a[i]).toFixed(0)));
    }; 
    return ad;
  }
  var convertDeg = function(a) {
    return +(radToDeg(a).toFixed(0));
  }
  var convertKnA = function(a) {
    var ad = [];
    for (var i = a.length - 1; i >= 0; i--) {
      ad.push(+(msToKnC(a[i]).toFixed(2)));
    }; 
    return ad;
  }
  var convertKn = function(a) {
    return +(msToKnC(a).toFixed(2));
  }



    return {
        resolve: resolve,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        convertDeg : convertDeg,
        convertDegA : convertDegA,
        convertKn : convertKn,
        convertKnA : convertKnA
    };
}());