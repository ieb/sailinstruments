/*jshint node:true */
"use strict";



(module.exports = function() {

  var resolve = function(valueStreams, databus) {
      for (var i = 0; i < valueStreams.length; i++) {
      valueStreams[i].stream = databus.getStreamForSourcePath(valueStreams[i].sourceId,valueStreams[i].path);
    };
  }

  function subscribeStream(vs) {
    vs.unsubscribe = vs.stream.onValue(vs.update);        
  }

  var subscribe = function(valueStreams){
    for (var i = 0; i < valueStreams.length; i++) {
      if (valueStreams[i].stream !== undefined) {
        subscribeStream(valueStreams[i]);
      } else {
        console.log("Warning, no value stream ", valueStreams[i]);
      }
    }
  }



  var unsubscribe = function( valueStreams) {
    for (var i = 0; i < valueStreams.length; i++) {
      if (valueStreams[i].unsubscribe !== undefined) {
        valueStreams[i].unsubscribe();
        valueStreams[i].unsubscribe = undefined;
      }
    }
  }



    return {
        resolve: resolve,
        subscribe: subscribe,
        unsubscribe: unsubscribe
    };
}());