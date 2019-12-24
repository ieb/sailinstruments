/*jshint node:true */
"use strict";

import React from 'react';
import CompassRose from './CompassRose.jsx';
import BoatRose from './BoatRose.jsx';
import DataBox from './DataBox.jsx';
import utils from './utils.jsx';
import { LatLonSpherical as LatLon } from 'geodesy';
import _ from "lodash";
import solentMarks from './SolentMarksCowesWeek2018.csv';
import Qty from 'js-quantities';
import './course.css';


const radToDeg = Qty.swiftConverter('rad', 'deg');
const mToNm = Qty.swiftConverter('m', 'nmi');
const mToKn = Qty.swiftConverter('m/s', 'kn');


class Course extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.props = props;
    this.currentpossition = new LatLon(-1,50);
    this.selectedWeather = "D7379";
    this.state = {
        course: props.course || ""
    }
    this.roundings = {
        "P": "port",
        "S": "starboard",
        "PP": "pass port",
        "PS": "pass starboard",
        "T": "pass through"
    }
    this.bouys = {
        "BY": "N BY",
        "BYB": "E BYB",
        "YB": "S YB",
        "YBY": "W YBY"
    }
    this.loadMarks();
    this.buildRoute(props.course || "");
    this.state.marksDb = this.marksDb; 
    this.state.route = this.route;
  }

  static updateDefaultProperties(app, newTab, layout) {
    layout.contents.className="cellContainer";
    _.defaults(layout.contents.props,{
        course: "",
        marks: ""
    });
  }



  static generateComponent(props, app) {
    return (
        <Course 
            course={props.course}
            marks={props.marks}
            twd={props.twd}
            app={app} />
        );
  }

  setProps(props, newState) {
    if ( props.marks !== this.props.marks || props.course !== this.props.course) {
        this.props = props;
        this.loadMarks();
        this.buildRoute(this.props.course);
        newState.marksDb = this.marksDb;
        newState.route = this.route;
        newState.total = this.total;
        return true;
    }
    return false;
  }


  componentWillReceiveProps(nextProps) {
    utils.componentWillReceiveProps( this, nextProps);
  }


  componentDidMount() {
    var self = this;
  }

  componentWillUnmount() {
  }


  // load marks from a cut and paste in the settings, or use a default
    loadMarks() {
        this.marksDb = {};
        var markList, toCols;
        if ( this.props.marks === undefined || this.props.marks.trim() === "") {
            markList = solentMarks;
            toCols= (x) => { return x};
        } else {
            markList = this.props.marks.trim().split("\n");
            toCols= (x) => { return x.trim().split(",");};
        }
        var idx = {};
        var cols = toCols(markList[0]);
        for (var i = 0; i < cols.length; i++) {
           idx[cols[i]] = i;
        };
        for (var i = 1; i < markList.length; i++) {
            var cols = toCols(markList[i])
            this.marksDb[cols[idx.name]] = {
                name: cols[idx.name],
                desc: cols[idx.desc],
                sym: cols[idx.sym],
                latlon: new LatLon(cols[idx.lat], cols[idx.lon])
            }
        };
    }

    buildRoute(course) {
        this.route = [];
        var ids = course.trim().replace("\n",",").split(",");
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i].toUpperCase();
          if ( id == '') {
            continue;
          }
          var re = { 
            id: id.substring(0,2)
          };
          if ( id.length > 2) {
            re.rounding = this.roundings[id.substring(2)];
          }
          // may be undefined, indicating the mark could not be found.
          re.wp = this.marksDb[re.id];
          this.route.push(re);
        };
        // calc distances and bearings.
        var total = 0;
        for (var i = 0; i < this.route.length; i++) {
            this.route[i].dist = total;
            if ( i < this.route.length-1 && this.route[i].wp !== undefined && this.route[i+1].wp !== undefined ) {
                var d = this.route[i].wp.latlon.rhumbDistanceTo(this.route[i+1].wp.latlon);
                this.route[i].dtw = d;
                total = total + d;
                this.route[i].btw = this.route[i].wp.latlon.rhumbBearingTo(this.route[i+1].wp.latlon)*Math.PI/180.0; // in degrees                
            }
        }
        this.updateDynamic();

    }

    // update all the data that is calculated from current observations.
    updateDynamic() {
        if ( this.twd !== undefined ) {
            for (var i = 0; i < this.route.length; i++) {
                 this.route[i].twa = this.toRelativeAngle(this.gwd - this.route[i].btw); 
            }            
        }

    }

    toRelativeAngle(r) {
        if ( r > Math.PI ) {
            return r - 2*Math.PI; 
        } else if ( r < -Math.PI) {
            return r + 2*Math.PI;
        }
        return r;
    }


    mToDisplay(d) {
        if ( d === undefined) {
            return "";
        }
        if (d < 100) {
            return d.toFixed(0)+" m";
        } 
        return mToNm(d).toFixed(1)+" nm";
    }
    radToDisplay(r) {
        if ( r === undefined) {
            return "";
        }
        return radToDeg(r).toFixed(0)+"°";
    }

    symToDisp(b) {
        if ( this.bouys[b] !== undefined) {
            return this.bouys[b];
        }
        return b;
    }
    msToDisp(b) {
        if ( b === undefined) {
            return "0.0";
        } 
        return mToKn(b).toFixed(1)+" kn";
    }


  renderRouteTable() {
    var rows = [];
    for (var i = 0; i < this.state.route.length; i++) {
        var r = this.state.route[i];
        if ( r.wp === undefined ) {
            rows.push(
                    (<tr key={i}>
                        <td>
                            {r.id}
                        </td>
                        <td></td>
                        <td>???</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    ));
        
        } else {
            rows.push(
                (<tr key={i} >
                    <td>
                        {r.wp.name}
                    </td>
                    <td>
                        {r.rounding}
                    </td>
                    <td>
                        {r.wp.desc}
                    </td>
                    <td className={"bouy"+r.wp.sym}>
                        {this.symToDisp(r.wp.sym)}
                    </td>
                    <td>{r.wp.latlon.toString("dm",3)}</td>
                    <td>{this.radToDisplay(r.btw)}</td>
                    <td>{this.mToDisplay(r.dtw)}</td>
                    <td>{this.mToDisplay(r.dist)}</td>
                    <th>{this.radToDisplay(r.twa)}</th>
                </tr>
                ));

        }
    };
    return (<table className="route">
                <tbody>
                    <tr key="header">
                        <th>ID</th>
                        <th>Rounding</th>
                        <th>Name</th>
                        <th>Bouy</th>
                        <th>latlon</th>
                        <th>BTW(M)</th>
                        <th>DTW</th>
                        <th>Total</th>
                        <th>TWA</th>
                    </tr>
                    {rows}

                </tbody>
            </table>);
  }

  renderMarksTable() {
    var rows = [];
    for ( var id in  this.state.marksDb) {
        var m = this.state.marksDb[id];
        rows.push(
            (<tr key={m.name}>
                <td>
                    {m.name}
                </td>
                <td>
                    {m.desc}
                </td>
                <td className={"bouy"+m.sym}>
                    {this.symToDisp(m.sym)}
                </td>
                <td>{m.latlon.toString("dm",3)}</td>
            </tr>
            ));
    };
    return (<table className="marks">
                <tbody>
                    <tr key="header">
                        <th>Name</th>
                        <th>Desc</th>
                        <th>Type</th>
                        <th>Position</th>
                    </tr>
                    {rows}
                </tbody>
            </table>);
  }



    renderCurrent() {
    return (
        <table className="current">
            <tbody>
                <tr>
                    <th>Next Mark</th>
                    <th>XTE</th>
                    <th>DTW</th>
                    <th>BTW</th>
                    <th>TTG</th>
                    <th>Layline Bearing</th>
                    <th>Layline Distance</th>
                    <th>Layline Time</th>
                </tr>
                <tr>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                    <td>?</td>
                </tr>
            </tbody>
        </table>
    );

    }

  render() {
    return (
        <div className="course" >
        <div className="headding">Weather</div>
        GWD <input type="text" name="gwd" />
        <a href="https://weatherfile.com/GBR000014&wt=KTS" >Lymington Starting Platform</a>
        <a href="https://weatherfile.com/RPR000154&wt=KTS" >Ryde Pier</a>
        <a href="https://weatherfile.com/GBR00002&wt=KTS" >Hurst Castle</a>
        <a href="https://weatherfile.com/GBR00004&wt=KTS" >Pool</a>
        <div className="headding">To next mark</div>
        {this.renderCurrent()}
        <div className="headding">Race Plan</div>
                {this.renderRouteTable()}
        <div className="headding">Available Marks</div>
                {this.renderMarksTable()}
        </div>
    );
  }

}

export default Course;