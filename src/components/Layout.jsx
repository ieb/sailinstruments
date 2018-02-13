/*jshint node:true */
"use strict";

import React from 'react';
import  ReactGridLayout from 'react-grid-layout';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import WindInstrument from './WindInstrument.jsx';
import PolarInstrument from './PolarInstrument.jsx';
import './react-tabs.css';


class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.key = new Date().getTime();
    this.namedComponents = {
      WindInstrument: WindInstrument,
      PolarInstrument: PolarInstrument
    };
    // register the layout with the app so that components can be registered.
    this.app.registerLayout(this);

    // layout contains the state, in serialisable form.
    // the name of the components must either be a html element or must be present in the namedComponents 
    // registered with layout.
    // for the moment hard code this, although a settings fialog would allow components to be added.
    // each component must exist inside its own div. Components cant share svg space.
    this.state = {
      editing: undefined,
      tabs: [
       {
        layout : [
          { i: "wind", x:0,  y:1, w:1, h:1, contents: { name: "WindInstrument", props : { northup: false }} },
          { i: "polar", x:1,  y:1, w:1, h:1, contents: { name: "PolarInstrument", props: {}} }
        ],
        key: 1,
        cols: 2,
        rowHeight: 600,
        width: 1200,
        title: 'tab1'        
       },
       {
        layout : [
          { i: "wind", x:0,  y:1, w:1, h:1, contents: { name: "WindInstrument", props : { northup: false }} },
          { i: "polar", x:1,  y:1, w:1, h:1, contents: { name: "PolarInstrument", props: {}} }
        ],
        key: 2,
        cols: 2,
        rowHeight: 600,
        width: 1200,
        title: 'tab1'      
       }
      ]
    };
  }

  registerComponent(name, constructor) {
    this.namedComponents[name]= constructor;
  }


  addTab() {
    var newTabs = this.state.tabs.slice();
    this.key++;
    newTabs.push(
      {
        layout : [],
        key: this.key,
        cols: 2,
        rowHeight: 600,
        width: 1200,
        title: 'unamed'        
      });
    this.setState({tabs: newTabs});
  }


  copy(m) {
    var newM = {}
    for(var k in m) {
      if (m.hasOwnProperty(k) ) {
        newM[k] = m[k];
      }
    }
    return newM;
  }

  removeCell(tabKey, gridKey) {
    var newTabs = [];
    // immutabled remove the cell, which means replacing everything enroute to the cell
    // default shallow copies dont do this correctly, so do it the hard way.
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key === tabKey ) {

        var newTab = this.copy(this.state.tabs[i]);
        newTab.layout = [];
        for (var j = 0; j < this.state.tabs[i].layout.length; j++ ) {
          if ( this.state.tabs[i].layout[j].i !== gridKey ) {
            newTab.layout.push(this.state.tabs[i].layout[j]);
          }
        }
        newTabs.push(newTab);
      } else {
        newTabs.push(this.state.tabs[i]);
      }
    }
    console.log("Removing ", tabKey, gridKey, newTabs);
    this.setState({
      tabs: newTabs
    });
  }

  moveCell(tabKey, gridKey, dir) {
    var newTabs = [];
    // immutabled remove the cell, which means replacing everything enroute to the cell
    // default shallow copies dont do this correctly, so do it the hard way.
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key === tabKey ) {
        // take a 

        var newTab = this.copy(this.state.tabs[i]);
        newTab.layout = [];
        for (var j = 0; j < this.state.tabs[i].layout.length; j++ ) {
          if ( this.state.tabs[i].layout[j].i !== gridKey ) {
            newTab.layout.push(this.state.tabs[i].layout[j]);
            console.log("copied layout ",this.state.tabs[i].layout[j]);
          } else {
            var newLayout = this.copy(this.state.tabs[i].layout[j]);
            newLayout.x = Math.max(0,newLayout.x + dir.x); 
            newLayout.y = Math.max(0,newLayout.y + dir.y); 
            newLayout.w = Math.max(1,newLayout.w + dir.w); 
            newLayout.h = Math.max(1,newLayout.h + dir.h);
            newTab.layout.push(newLayout); 
            console.log("modified layout ",newLayout);
          }
        }
        console.log("Deep Copy ",this.state.tabs[i], newTab);
        newTabs.push(newTab);
      } else {
        console.log("Shallow Copy ",this.state.tabs[i]);
        newTabs.push(this.state.tabs[i]);
      }
    }
    console.log("After Move ", tabKey, gridKey, newTabs);
    this.setState({
      tabs: newTabs
    });
  }


  removeTab(key) {
    var newTabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key !== key ) {
        newTabs.push(this.state.tabs[i]);
      }
    }
    this.setState({tabs: newTabs});
  }

  onStartTabEdit(event, key) {
    if ( this.state.editing === undefined) {
      this.setState({
        editing: key
      });
    }
    event.preventDefault();
  }

  onUpdateTabTitle(event, key) {
    var newTabs = this.state.tabs.slice();
    for (var i = 0; i < newTabs.length; i++) {
      if ( newTabs[i].key === key) {
        newTabs[i].title = event.target.value;
      }
    }
    this.setState({
      tabs: newTabs
    });
    event.preventDefault();

  }
  onFinishTabEdit(key) {
    this.setState({
      editing: undefined
    });    
    event.preventDefault();
  }


  renderGridElement(tabKey, gridElement) {
    console.log("GridElement ", gridElement);
    var props = gridElement.contents.props;
    props.app = this.app;
    var component = React.createElement(this.namedComponents[gridElement.contents.name], props);
    return (
        <div key={gridElement.i} >
        <div className="gridElementControls" >
        <button 
          onClick={() => { this.removeCell(tabKey, gridElement.i) }} >&#10754;</button>
        <button  
          onClick={() => { this.moveCell(tabKey, gridElement.i, { x: -1, y: 0, w: 0, h: 0}) }} >&#8592;</button>
        <button  
          onClick={() => { this.moveCell(tabKey, gridElement.i, { x: 0, y: -1, w: 0, h: 0}) }} >&#8593;</button>
        <button  
          onClick={() => { this.moveCell(tabKey, gridElement.i, { x: 1, y: 0, w: 0, h: 0}) }} >&#8594;</button>
        <button  
          onClick={() => { this.moveCell(tabKey, gridElement.i, { x: 0, y: 1, w: 0, h: 0}) }} >&#8595;</button>
        </div>
        {component}
        </div>
    );

  }


  renderGrid(tab) {
    var renderedLayout = [];
    for (var i = 0; i < tab.layout.length; i++) {
      var gridElement = tab.layout[i];
      renderedLayout.push(this.renderGridElement(tab.key, gridElement));
    };
    console.log("Layout ", renderedLayout);
    return renderedLayout;
  }


  renderTab(n) {
    var key = this.state.tabs[n].key;
    if ( this.state.editing === key ) {
      return (<Tab key={key} ><form onSubmit={(e) => { this.onFinishTabEdit(e,key) }} ><input type="text" value={this.state.tabs[n].title} onChange={(e) => {this.onUpdateTabTitle(e,key)}}/></form></Tab>)
    } else {
      return (<Tab key={key} onDoubleClick={(e) => {this.onStartTabEdit(e, key)}} >{this.state.tabs[n].title}<button onClick={() => { this.removeTab(key) }} >&#10754;</button></Tab>)
    }
  }

  renderTabs() {
    var tabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      tabs.push(this.renderTab(i));
    }
    return tabs;
  }
  renderPanels() {
    var panels = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      panels.push((<TabPanel key={this.state.tabs[i].key}>
          <ReactGridLayout className="layout" 
            layout={this.state.tabs[i].layout} 
            cols={this.state.tabs[i].cols} 
            rowHeight={this.state.tabs[i].rowHeight} 
            width={this.state.tabs[i].width}>
          {this.renderGrid(this.state.tabs[i])}
          </ReactGridLayout>
        </TabPanel>));
    }
    return panels;
  }

  render() {
    return (
      <Tabs>
        <TabList>
          {this.renderTabs()}
        </TabList>
        {this.renderPanels()}
      </Tabs>
    );
  }

}

export default Layout;