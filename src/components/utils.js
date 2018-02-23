/*jshint node:true */
"use strict";




(module.exports = function() {

  const Qty  = require('js-quantities');

  const radToDeg = Qty.swiftConverter('rad', 'deg');
  const msToKn = Qty.swiftConverter('m/s', 'kn');


  var resolve = function(valueStreams, databus) {
      for (var i in  valueStreams) {
        valueStreams[i].stream = databus.getStreamForSourcePath(valueStreams[i].sourceId,valueStreams[i].paramPath);
        if ( valueStreams[i].stream === undefined ) {
          console.log("Resolved Failed ", valueStreams[i].sourceId,valueStreams[i].paramPath, valueStreams[i].stream);
        }
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
      ad.push(+(msToKn(a[i]).toFixed(2)));
    }; 
    return ad;
  }
  var convertKn = function(a) {
    return +(msToKn(a).toFixed(2));
  }

  const radToDegF  = function(x) {
    return radToDeg(x).toFixed(0);
  }
  const msToKnF = function(x) {
    var v = msToKn(x);
    if (v < 10) {
      return v.toFixed(2);
    } else {
      return v.toFixed(1);
    }
  }

  const percentF = function(x) {
    var v = x * 100;
    if (v < 10) {
      return v.toFixed(1);
    } else {
      return v.toFixed(0);
    }
  }

  const asIs = function(x) {
      return x;
  }



  var getDisplay = function(units) {
    if ( units === "deg" ){
        return radToDegF;
    } else if ( units === "kn" ) {
        return msToKnF;
    } else if ( units === "%" ) {
        return percentF;
    } else {
        return asIs;
    }
  }

  var getSymbol = function(units) {
    if ( units === "deg" ){
        return "deg"
    } else if ( units === "kn" ) {
        return "kn";
    } else if ( units === "%" ) {
        return "%";
    } else if ( units === "C") {
        return "C"
    } else {
      return "";
    }
  }





    return {
        resolve: resolve,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        convertDeg : convertDeg,
        convertDegA : convertDegA,
        convertKn : convertKn,
        convertKnA : convertKnA,
        getDisplay: getDisplay,
        getSymbol: getSymbol
    };
}());