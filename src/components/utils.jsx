/*jshint node:true */
"use strict";
import * as d3 from 'd3';

const Qty  = require('js-quantities');
const radToDeg = Qty.swiftConverter('rad', 'deg');
const msToKn = Qty.swiftConverter('m/s', 'kn');

const radToDegF  = function(x) {
  return +radToDeg(x).toFixed(0);
}
const msToKnF = function(x) {
  var v = msToKn(x);
  if (v < 10) {
    return +v.toFixed(2);
  } else {
    return +v.toFixed(1);
  }
}

const percentF = function(x) {
  var v = x * 100;
  if (v < 10) {
    return +v.toFixed(1);
  } else {
    return +v.toFixed(0);
  }
}

const asIs = function(x) {
    return x;
}




class Utils {





  static resolve(valueStreams, databus) {
      for (var i in  valueStreams) {
        valueStreams[i].stream = databus.getStreamForSourcePath(valueStreams[i].sourceId,valueStreams[i].paramPath);
        if ( valueStreams[i].stream === undefined ) {
          console.log("Resolved Failed ", valueStreams[i].sourceId,valueStreams[i].paramPath, valueStreams[i].stream);
        }
      };
  }


  static subscribe(valueStreams){
    for (var i in  valueStreams) {
      if (valueStreams[i].stream !== undefined) {
        valueStreams[i].unsubscribe = valueStreams[i].stream.onValue(valueStreams[i].update);        
      } else {
        console.log("Warning, no value stream ", valueStreams[i]);
      }
    }
  }



  static unsubscribe( valueStreams) {
    for (var i in  valueStreams) {
      if (valueStreams[i].unsubscribe !== undefined) {
        valueStreams[i].unsubscribe();
        valueStreams[i].unsubscribe = undefined;
      }
    }
  }

  static compareRad(a,b) {
    return Utils.convertDeg(a) !== Utils.convertDeg(b);
  }

  static compareDeg(a,b) {
    return a.toFixed(0) !== b.toFixed(0);
  }

  static compareMs(a,b) {
    return Utils.convertKn(a) !== Utils.convertKn(b);
  }

  static compareKn(a,b) {
    return a.toFixed(2) !== b.toFixed(2);
  }

  static compareIgnore(a,b) {
    return false;
  }

  static convertDegA(a) {
    var ad = [];
    for (var i = a.length - 1; i >= 0; i--) {
      ad.push(+(radToDeg(a[i]).toFixed(0)));
    }; 
    return ad;
  }
  static convertDeg(a) {
    return +(radToDeg(a).toFixed(0));
  }
  static convertKnA(a) {
    var ad = [];
    for (var i = a.length - 1; i >= 0; i--) {
      ad.push(+(msToKn(a[i]).toFixed(2)));
    }; 
    return ad;
  }
  static convertKn(a) {
    return +(msToKn(a).toFixed(2));
  }




  static getDisplay(units) {
    if ( units === "deg"  ){
        return radToDegF;
    } else if ( units === "kn" ) {
        return msToKnF;
    } else if ( units === "%" ) {
        return percentF;
    } else {
        return asIs;
    }
  }

  static getSymbol(units) {
    if ( units === "deg"  ){
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

  static loadLocalData() {
    var localData = {};
    try {
      var fromLocal = window.localStorage.getItem('sailingInstruments');
      if (fromLocal) {
        localData = JSON.parse(fromLocal);
      }
    } 
    catch (ex) {
      console.error(ex);
    }
    return localData;
  }


  static saveLocalData(key, data) {
    var localStorageData = Utils.loadLocalData();
    localStorageData[key] = data;
    try {
      window.localStorage.setItem('sailingInstruments', JSON.stringify(localStorageData));
      console.log("Saved ", key);
    } catch (ex) {
      console.error(ex)
    }
  };
  static loadLocalDataItem(key) {
    return Utils.loadLocalData()[key];
  };



  static saveDrawState(state, drawState) {
    for(var p in state) {
      try {
        if ( Array.isArray(state[p])) {
          if ( drawState[p] === undefined) {
            drawState[p] = [];
          }
          for(var j = 0; j < state[p].length; j++ ) {
            drawState[p][j] = state[p][j];
          }
        } else if ( state[p] !== undefined ) {
          drawState[p] = state[p];            
        }
      } catch(e) {
        console.error(p,e);
      }
    }
  }

  static getRedrawData(cstate, dstate, sig, props) {
    for(var i in props) {
      var p = props[i];
      if ( Array.isArray(cstate[p])) {
        if ( dstate[p] === undefined ||  dstate[p].length !== cstate[p].length) {
           return cstate;
        } else {
          for(var j = 0; j < cstate[p].length; j++ ) {
            if (sig[p](cstate[p][j], dstate[p][j]) ) {
              return cstate;
            }
          }
        }
      } else {
        if (dstate[p] === undefined || sig[p](dstate[p], cstate[p]) ) {
          return cstate;
        }            
      }
    }
    return undefined;
  }



  /**
   *
   */
  static iir(v, c, d) {
    if ( d === 0 || v === undefined ) {
      if ( isNaN(c) ) {
        return 0;
      } else {
        return c;
      }
    } else {
      if ( isNaN(c)) {
        return v;
      } else {
        return ((v*(d-1))+c)/(d);
      }
    }
  }

  static iirDeg(v, c, d, min, max) {
    if ( d  === 0 || v == undefined ) {
      return c;      
    } else {
      min = min || 0;
      max = max || 360;
      return Utils.iirRad(v*Math.PI/180, c*Math.PI/180, d, min*Math.PI/180, max*Math.PI/180)*180/Math.PI;
    }
  }

  static iirRad(v, c, d, min, max) {
      if ( d === 0 || v === undefined ) {
        if ( isNaN(c)) {
          return 0;
        } else {
          return c;
        }
      }
      if ( isNaN(c) ) {
        return v;
      }
      min = min || 0;
      max = max || Math.PI*2;
      var a = Math.atan2(Utils.iir(Math.sin(v), Math.sin(c), d), Utils.iir(Math.cos(v), Math.cos(c), d));
      while( a < min ) {
        a = a + Math.PI*2;
      }
      while( a > max ) {
        a = a - Math.PI*2;
      }
      return a;
  }







  /**
   * line is in the form { [rad, radius ] }
   */
  static drawSmoothRadialLine(ctx, line, lineWidth, color) {
    const radialLine = d3.radialLine().curve(d3.curveBasis);
    ctx.beginPath();
    radialLine.context(ctx)(line);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.stroke();
  }




}
export default Utils;