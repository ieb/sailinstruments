/*jshint node:true */
"use strict";

const Qty  = require('js-quantities');


module.exports = function(){

  var conversions = {
    "m/s": {
      "kn": Qty.swiftConverter("m/s", "kn"),
      "km/h": Qty.swiftConverter("m/s", "km/h")
    },
    "m3/s": {
      "l/min": Qty.swiftConverter("m^3/s", "liter/minute"),
      "l/h": Qty.swiftConverter("m^3/s", "liter/hour"),
      "g/min": Qty.swiftConverter("m^3/s", "gallon/minute"),
      "g/h": Qty.swiftConverter("m^3/s", "gallon/hour")
    },
    "K": {
      "C": Qty.swiftConverter("tempK", "tempC"),
      "F": Qty.swiftConverter("tempK", "tempF")
    },
    "Hz": {
      "1/min": function(hz) {
        return hz * 60;
      },
      "10/min": function(hz) {
        return hz * 60 / 10;
      },
      "100/min": function(hz) {
        return hz * 60 / 100;
      },
      "1000/min": function(hz) {
        return hz * 60 / 1000;
      }
    },
    "m": {
      "fathom": Qty.swiftConverter('m', 'fathom'),
      "feet": Qty.swiftConverter('m', 'foot'),
      "km": Qty.swiftConverter('m', 'km'),
      "nm": Qty.swiftConverter('m', 'nmi'),
      "mi": Qty.swiftConverter('m', 'mi')
    },
    "Pa": {
      "hPa": Qty.swiftConverter('pascal', 'hPa'),
      "bar": Qty.swiftConverter('pascal', 'bar'),
      "mbar": Qty.swiftConverter('pascal', 'millibar'),
      "psi": Qty.swiftConverter('pascal', 'psi'),
      "mmHg": Qty.swiftConverter('pascal', 'mmHg')
    },
    "s": {
      "minutes": Qty.swiftConverter('s', 'minutes'),
      "hours": Qty.swiftConverter('s', 'hours'),
      "days": Qty.swiftConverter('s', 'days')
    },
    "rad/s": {
      "deg/s": Qty.swiftConverter('rad/s', 'deg/s'),
      "deg/min": Qty.swiftConverter('rad/s', 'deg/min')
    },
    "rad" : {
      "deg": Qty.swiftConverter('rad', 'deg'),
    },
    "ratio" : {
      "%" : function(r) {
        return r*100;
      }
    }
  }

  const precisionNumber = function(value){
    return precisionConv(value, [50,10,0]);
  }

  const precisionAngle = function(value){
    // all angles are fixed(0)
    return precisionConv(value, [0]);
  }

  const precisionConv = function(value, breaks) {
    if(breaks !== undefined && typeof value === 'number') {
      var v = Math.abs(value);
      for (var i = 0; i < breaks.length; i++) {
        if ( v > breaks[i] ) {
          return +value.toFixed(i);
        }
      }
    }
    return value;
  }
  const asIs = function(value) {
    return value;
  }

  const precision = {
    "deg" : precisionAngle,
    "datetime": asIs,
    "latlon": asIs
  }

  const getPrecisionForUnit = function(unit, displayUnit) {
    return precision[displayUnit] || precisionNumber;
  }


  const getConversionsForUnit = function(unit, displayUnit) {
    if ( conversions[unit] !== undefined && conversions[unit][displayUnit] !== undefined ) {
      return conversions[unit][displayUnit];
    } 
    if ( unit === displayUnit) {
      return asIs;
    }
    try {
      var c = Qty.swiftConverter(unit,displayUnit);
      if ( c !== undefined) {
        return c;
      }      
    } catch (e) {
      console.error("Failed to get converter ", unit, displayUnit);
    }
    return asIs;
  }

  // some of this is borrowed form IntrumentPanel which looks like the right way to do it as most or all
  // the items are defined in the SkignalK schema.
  var schema = require('@signalk/signalk-schema');
  var schemaPatch = require('./schema_patch.json');


  for (var key in schema.metadata) {
    schema.metadata[key].regex = new RegExp(key.replace('.', '\.').replace('*', '.*').replace('$', ''));
  }

  const getLabelForPath = function(path) {
    var i18nElement = schemaPatch.i18n.en[path] || schema.i18n.en[path] 
    return i18nElement ?
      i18nElement.shortName || i18nElement.longName || "??" :
      path
  }

  const getUnitForPath = function(path) {
    if ( schemaPatch.metadata[path] !== undefined && schemaPatch.metadata[path].unit !== undefined ) {
      return schemaPatch.metadata[path].unit;
    }
    return schema.getUnits('vessels.foo.' + path);
  }



  // User control over the display units.
  // the key is the unit.
  // if the value contains a display key, then the same 
  // units are used with no auto scaling.
  // if not, then each entry defines a limit. If the converted value in the units defined
  // by the default entry is less than the limit, the replacement units are used. Otherwise
  // the default units are used. eg for "m", < 0.2 nm m is used otherwise nm. This handles
  // very short distances and depths correctly, although if your depth sounder goes down to 
  // 1000m then it may display in nm. 
  // with a default key if the value is no
  var displayUnits = {
    "m" : {
      short: {
        limit: 0.2,
        units: "m",
        title: "measurement"
      }, 
      "default": {
        units: "nm",
        title: "distance"
      }
    },
    "rad" : {
      units: "deg",
      title: "angle"
    },
    "%" : {
      units: "%",
      title: "ratio"
    },
    "A" : {
      units: "A",
      title: "ratio"
    },
    "C" : {
      units: "C",
      title: "charge"
    },
    "Hz" : {
      hz : {
        limit: 1E3,
        units: "Hz",
        title: "frequency"
      },
      khz : {
        limit: 1E6,
        units: "KHz",
        title: "frequency"
      },
      mhz : {
        limit: 1E9,
        units: "MHz",
        title: "frequency"
      },
      ghz : {
        limit: 1E20,
        units: "GHz",
        title: "frequency"
      },
      "default": {
        units: "Hz",
        title: "frequency"
      }
    },
    "J" : {
      units: "J",
      title: "energy"
    },
    "K" : {
      units: "C",
      title: "temperature"
    },
    "Lux" : {
      units: "Lux",
      title: "luminesance"
    },
    "Pa" : {
      units: "mbar",
      title: "pressure"
    },
    "Pa/s" : {
      units: "mbar/s",
      title: "pressure change"
    },
    "RFC 3339 (UTC)" : {
      units: "dateformat",
      title: "datetime"
    },
    "V" : {
      units: "V",
      title: "voltage"
    },
    "W" : {
      units: "W",
      title: "power"
    },
    "deg" : {
      units: "deg",
      title: "latlong"
    },
    "kg" : {
      units: "kg",
      title: "mass"
    },
    "kg/m3" : {
      units: "kg/m3",
      title: "density"
    },
    "m/s" : {
      units: "kn",
      title: "speed"
    },
    "m2" : {
      units: "m2",
      title: "area"
    },
    "m3" : {
      units: "m3",
      title: "volume"
    },
    "m3/s" : {
      units: "m3/s",
      title: "flow rate"
    },
    "rad/s" : {
      units: "deg/s",
      title: "angular rate"
    },
    "ratio" : {
      units: "%",
      title: "ratio"
    },
    "s" : { // elapsed time
      days: { // < 100 years, ie catch all.
        limit: 100*356*24*3600,
        units: "days",
        title: "days",
      },
      hours: { // < 48h
        limit: 2*24*3600,
        units: "hours",
        title: "hours",
      },
      min: { // < 90min
        limit: 90*60,
        units: "min",
        title: "minutes",
      },
      min: { // < 120s
        limit: 120,
        units: "s",
        title: "seconds",
      },
      units: "s",
      title: "ratio"
    }
  };



  const getDisplayUnitForPath = function(value, path, unit) {
    unit = unit || getUnitForPath(path);
    var disp = unit;
    if ( displayUnits[unit] !== undefined ) {
      if (displayUnits[unit].units !== undefined ) {
        disp = displayUnits[unit].units;
      } else {
        disp = displayUnits[unit].default.units;
        var currentValue = getConversionsForUnit(unit,disp)(value);
        for( var k in m) {
          if (displayUnits[unit][k].limit !== undefined ) {
            if (currentValue < displayUnits[unit][k].limit) {
              disp = displayUnits[unit][k].units;
            }
          }
        }
      }
    }
    return disp;
  }


  const getPath = function(fullPath) {
    return fullPath.split('.').slice(1).join(".");
  }

  const displayForFullPath = function(value, path) {
    return displayForPath(value, getPath(path));
  }


  const displayForPath = function(value, path) {
    var unit = getUnitForPath(path);
    // if this didnt depend on value, it could be static, but the distance
    // units do depend on value and atpresent units is not a function.
    // probably doesnt cot much to do this all as its lookups.
    var displayUnit = getDisplayUnitForPath(value, path, unit);
    var conversion = getConversionsForUnit(unit,displayUnit);
    var precision = getPrecisionForUnit(unit,displayUnit);
    var label = getLabelForPath(path);
    return {
      path: path,
      precision: precision,
      conversion: conversion,
      units: displayUnit,
      title: label,
      measurementUnit: unit,
      measurement: value,
      value: precision(conversion(value)),
    }
  }


  return {
    displayForFullPath: displayForFullPath,
    getUnitForPath: getUnitForPath,
    displayUnits: displayUnits
  }

}();




