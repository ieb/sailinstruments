/*jshint node:true */
"use strict";

import React from 'react';
import Modal from 'react-modal';
import _ from "lodash";


class StripChartConfigure extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = _.clone(this.props.state);
    this.configureCell = props.configureCell;
    this.onChange = this.onChange.bind(this);
    this.onDataSetChange = this.onDataSetChange.bind(this);
    this.getState = this.getState.bind(this);
    this.configureCell.bindGetState(this.getState);
    console.log("StripChart configure new");
  }

  getState() {
    console.log("Final State", this.state);
    return this.state;
  }

  isTrue(v) {
    return v === "on" || v === "true" || v === true;
  }



  onDataSetChange(event, i, key) {
    var newState = {};
    newState.datasets = _.clone(this.state.datasets);
    newState.datasets[i] = _.clone(newState.datasets[i]);
    if ( typeof newState.datasets[i][key] === "number" ) {
      newState.datasets[i][key] = +event.target.value;
    } else if ( typeof newState.datasets[i][key] === "boolean") {
      newState.datasets[i][key] = this.isTrue(event.target.value);
    } else {
      newState.datasets[i][key] = event.target.value;
    }
    this.setState(newState);
  }

  addDataSet(i) {
    var k = "datapath"+i;
    var value = this.state.datasets[i];
    return (
      <div key={k} className="settingsGroup" >
        <label>Path</label>
            <select value={value.path} 
            onChange={(e) => { this.onDataSetChange(e,i,"path")}} >
            {this.configureCell.getPathOptions(value.path)}
            </select> 
        <label>enabled</label>
            <input type="checkbox" checked={value.enabled} 
              onChange={(e) => { this.onDataSetChange(e,i,"enabled")}} />
        <label>zero base</label>
            <input type="checkbox" checked={value.zerobase} 
              onChange={(e) => { this.onDataSetChange(e,i,"zerobase")}} />
      </div>);

  }

  onChange(e) {
    var newState = {};
    if ( typeof this.state[name] === 'number') {
      newState[e.target.name] = +e.target.value;      
    } else if ( typeof this.state[name] === 'boolean') {
      newState[e.target.name] = this.isTrue(e.target.value);      
    } else {
      newState[e.target.name] = +e.target.value;            
    }
    this.setState(newState);
  }

  buildFormContent() {
    var formContent = [];
    formContent.push((<label key="a">Update Rate (ms)</label>));
    formContent.push((<input key="a1" type="number" min="100" 
          name="updaterate" 
          value={this.state.updaterate} onChange={this.onChange} />));
    formContent.push((<label key="b">History (s)</label>));
    formContent.push((<input key="b1" type="number" min="10" step="1" 
          name="historyLength"  
          value={this.state.historyLength} onChange={this.onChange} />));
    formContent.push((<label key="c">Damping</label>));
     formContent.push((<input key="c1" type="number" min="1" step="1" 
          name="damping"  
          value={this.state.damping} onChange={this.onChange} />));
    for (var i = 0; i < this.state.datasets.length; i++) {
      formContent.push(<label key={"l"+i} >Data Set</label>);
      formContent.push(this.addDataSet(i));
    };
    return formContent;
  }

  render() {
    return ( 
      <div className="settingsForm" >
      {this.buildFormContent()}
      </div>
    )
  }


}

export default StripChartConfigure;