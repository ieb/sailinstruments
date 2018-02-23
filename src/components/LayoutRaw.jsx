/*jshint node:true */
"use strict";

import React from 'react';
import utils from './utils.js'
import _ from 'lodash';

class LayoutRaw extends React.Component {
  /**
   * <DataBox translate="50,5" 
   *      sourceId="sourceId" 
   *      path="path",
   *      displayvalue="function(x) { return x; }"
   *      title"awa"
   */
  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.state = {
        layoutData : "",
        message: undefined,
        valid: false,
        validation: []
    };
    this.update = this.update.bind(this);
    this.submit = this.submit.bind(this);
    this.change = this.change.bind(this);
    this.doReset = this.doReset.bind(this);
    this.layoutDataStream = {
        sourceId: "internal",
        paramPath: "layoutData",
        update: this.update
    };
  }

  componentDidMount() {
    if ( !this.bound ) {
      this.bound = true;  
      utils.resolve( [ this.layoutDataStream], this.app.databus);
      utils.subscribe([ this.layoutDataStream ], this);
    }
  }

  componentWillUnmount() {
    this.bound = false;
    utils.unsubscribe([ this.layoutDataStream ]);
  }


  update(state) {
    if (this.bound ) {
        this.setState({
          layoutData : JSON.stringify(state, null, 2),
          currentData : JSON.stringify(state, null, 2),
          message: "",
          valid: true
        });
    }
  }
  submit(event) {
    if ( this.state.valid ) {
      var validation = [];
      // correct any keys that must be uinique.
      var data = JSON.parse(this.state.layoutData);
      var tabkeys = {};
      for(var t in data.tabs) {
        var tab = data.tabs[t];
        console.log("Checking ",t,tab);
        if ( tab.key === undefined ) {
          validation.push((<div key={validation.length}>Key missing from tab { t } </div>));
        } else if (tabkeys[tab.key] !== undefined ) {
          validation.push((<div key={validation.length} >Duplicate Key { tab.key } in tab { t }</div>));
        } else {
            tabkeys[tab.key] = tab.key;
        }
        var keys = {};
        for ( var l in tab.layout) {
          if ( tab.layout[l].i === undefined ) {
            validation.push((<div key={validation.length}>Key  {i} missing from tab  {t} layout {l}</div>));
          } else if ( keys[tab.layout[l].i] !== undefined ) {
            validation.push((<div key={validation.length}>Duplicate Layout Key {tab.layout[l].i} in tab {t} layout {l}</div>));
          } else {
            keys[tab.layout[l].i] = tab.layout[l].i;

          }
        }
      }
      if ( validation.length === 0 ) {
        this.app.layout.updateLayout(JSON.parse(this.state.layoutData));      
      }
      this.setState({
        validation: validation
      });
    }
    event.preventDefault();
  }
  change(event) {
    var message = "ok";
    var valid = false;
    try {
      var v = JSON.parse(event.target.value);
      valid = true;
    } catch(e) {
      message  = e.message;
    }
    this.setState({ 
      layoutData: event.target.value,
      message : message,
      valid: valid
    });
  }
  doReset() {
    this.setState( {
      layoutData : this.state.currentData,
      valid: true,
      message: "reset ok"
    });
  }


  render() {
    return (
      <form onSubmit={this.submit} >
      <textarea value={this.state.layoutData} onChange={this.change} rows="80" cols="132" ></textarea>
      <div>
      {this.state.message}
      </div>
      <div>
      {this.state.validation}
      <input type="submit" value="Apply" />
      <button onClick={this.doReset} >Reset</button>
      </div>
      </form>
      );
  }

}

export default LayoutRaw;