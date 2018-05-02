This file contains some patches applied to various components in SignalK, that should be submitted back to the main SignalK project.


influxDB_index.js 
When the influx DB server is unreachable the standard influxDB reporter spams the logs with exceptions. This version emits single lines, which still spams the logs, but not quite so badly.


When the NMEA2000 analyser encounters a group request Pgn 126208 with unrecognised contents it spams the logs.
This patch filters that, enabled with a subOptions of filterPGN126208Errors : true in settings.

    x43543-2:signalk-server-node ieb$ git diff
    diff --git a/providers/n2kAnalyzer.js b/providers/n2kAnalyzer.js
    index 2317c86..ddbd705 100644
    --- a/providers/n2kAnalyzer.js
    +++ b/providers/n2kAnalyzer.js
    @@ -33,7 +33,18 @@ function N2KAnalyzer (options) {
         ])
       }
       this.analyzerProcess.stderr.on('data', function (data) {
    -    console.error(data.toString())
    +    // if filterPGN126208Errors is presentin subOptions, then filter out all messages 
    +    // containing Pgn 126208 which will be related to parsing Group fundtion requests.
    +    // The format of these messages is proprietary and if not in the PGN database
    +    // cant be parsed. Where they are present, they will fill the logs, rapidly.
    +    if (options.filterPGN126208Errors ) {
    +      var line = data.toString();
    +      if ( line.indexOf("Pgn 126208") < 0 ) {
    +        console.error(line);
    +      }
    +    } else {
    +      console.error(data.toString())
    +    }
       })
       this.analyzerProcess.on('close', function (code) {
         console.error('Analyzer process exited with code ' + code)
    x43543-2:signalk-server-node ieb$ 