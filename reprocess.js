/*jshint node:true */
"use strict";

// reprocesses the output of candump2analyser so that the lines are timestamped to give the output a rate.
// node reprocess.js <rate>   eg candump2analyzer candump-2018-05-07-15-39.log | node reprocess.js 80


const fs = require('fs');

var msPerLine = 1000/parseInt(process.argv[2]);
var n = new Date().getTime();

var buffer = "";
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if ( chunk !== null) {
      buffer = buffer + chunk;
      var lines = chunk.split("\n");
      for ( var i = 0; i < lines.length-1; i++) {
        var parts = lines[i].split(",");
        n = n+msPerLine;
        parts[0] = new Date(n).toISOString().replace("T","-").replace("Z","");
        process.stdout.write(parts.join(',')+"\n");
      }
      if ( buffer[buffer.length-1] == '\n') {
          buffer = lines[lines.length-1]+'\n';     
      } else {
          buffer = lines[lines.length-1];             
      }
  }
});

