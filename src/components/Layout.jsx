/*jshint node:true */
"use strict";

import React from 'react';
import  ReactGridLayout from 'react-grid-layout';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import WindInstrument from './WindInstrument.jsx';
import PolarInstrument from './PolarInstrument.jsx';
import DataInstrument from './DataInstrument.jsx';
import InlineEdit from './InlineEdit.jsx';
import ConfigureGridElement from './ConfigureGridElement.jsx';
import _ from "lodash";
import './react-tabs.css';


class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.key = new Date().getTime();
    this.namedComponents = {
      WindInstrument: WindInstrument,
      PolarInstrument: PolarInstrument,
      DataInstrument: DataInstrument
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
          { i: "wind", x:0,  y:1, w:10, h:10, contents: { name: "WindInstrument", props : { northup: false }} },
          { i: "polar", x:10,  y:1, w:10, h:10, contents: { name: "PolarInstrument", props: {}} }
        ],
        key: 1,
        cols: 20,
        rowHeight: 60,
        width: 1200,
        title: 'tab1'        
       },
       {
        layout : [
          { i: "wind", x:0,  y:1, w:10, h:10, contents: { name: "WindInstrument", props : { northup: false }} },
          { i: "polar", x:10,  y:1, w:10, h:10, contents: { name: "PolarInstrument", props: {}} }
        ],
        key: 2,
        cols: 20,
        rowHeight: 60,
        width: 1200,
        title: 'tab1'      
       }
      ]
    };
    this.doneConfigureGridElement = this.doneConfigureGridElement.bind(this);
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
        cols: 10,
        rowHeight: 120,
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



  removeTab(tab) {
    var newTabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key !== tab.key ) {
        newTabs.push(this.state.tabs[i]);
      }
    }
    this.setState({
      tabs: newTabs,
      activeMenu: undefined
    });
  }

  onAddClick(tab, componentName, width, height) {
    var newTabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key === tab.key ) {
        var newTab = this.copy(this.state.tabs[i]);
        newTab.layout = this.state.tabs[i].layout.slice();
        this.key++;
        var props = {};
        if ( typeof this.namedComponents[componentName].getDefaultProperties === 'function') {
          props =  this.namedComponents[componentName].getDefaultProperties();
        } 
        newTab.layout.push({ i: ""+this.key, x:0,  y:0, w:width, h:height, contents: { name: componentName, props: props }});
        newTabs.push(newTab);
      } else {
        newTabs.push(this.state.tabs[i]);
      }
    }
    this.setState({
      tabs: newTabs,
      activeMenu: undefined
    });
  }

  onTabMenuHide(event, tab) {
    this.setState({
      activeMenu: undefined
    });
    event.preventDefault();
  }
  onTabMenuShow(event, tab) {
    if ( this.state.activeMenu === undefined ) {
      this.setState({
        activeMenu: tab.key
      });
    }
    event.preventDefault();
  }

  componentDidUpdate() {
    this.app.databus.push("internal", { path: "layoutData", value: this.state});    
  }

  onStartTabEdit(event, tab) {
    if ( this.state.editing === undefined) {
      this.setState({
        editing: tab.key
      });
    }
    event.preventDefault();
  }

  configureGridElement(tab, gridElement) {
    console.log("Would configure ", gridElement);
    this.setState({
      configuringElement: gridElement,
      configuringTab: tab
    });
  }

  doneConfigureGridElement() {
    console.log("Done configure ");
    this.setState({
      configuringElement: undefined,
      configuringTab: undefined
    });
  }

  onFinishTabEdit(tab, value) {
    var newTabs = this.state.tabs.slice();
    for (var i = 0; i < newTabs.length; i++) {
      if ( newTabs[i].key === this.state.editing) {
        newTabs[i].title = value;
      }
    }
    this.setState({
      editing: undefined,
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
            var newCell = this.copy(this.state.tabs[i].layout[j]);
            newCell.x = Math.max(0,newCell.x + dir.x); 
            newCell.y = Math.max(0,newCell.y + dir.y); 
            newCell.w = Math.max(1,newCell.w + dir.w); 
            newCell.h = Math.max(1,newCell.h + dir.h);
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

  onLayoutChange(layout, tab) {

    var newTabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      if ( this.state.tabs[i].key === tab.key ) {
        var newTab = this.copy(this.state.tabs[i]);
        var layoutByKey = {};
        console.log("Applying ",layout);
        for (var j = 0; j < layout.length; j++) {
          layoutByKey[layout[j].i] = layout[j];
        }
        for (var j = 0; j < this.state.tabs[i].layout.length; j++) {
          layoutByKey[this.state.tabs[i].layout[j].i].contents = this.state.tabs[i].layout[j].contents;
        }        
        newTab.layout = layout;
        newTabs.push(newTab);
      } else {
        newTabs.push(this.state.tabs[i]);
      }
    }
    this.setState({
      tabs: newTabs
    });
  }

  updateLayout(layoutData) {
    this.setState(layoutData);
  }


  renderGridElement(tab, gridElement) {
    console.log("GridElement ", gridElement);
    var props = _.cloneDeep(gridElement.contents.props);
    props.app = this.app;
    var component = React.createElement(this.namedComponents[gridElement.contents.name], props);
      return (
          <div key={gridElement.i} >
          <div className="gridElementControls" >
          <button 
            onClick={() => { this.removeCell(tab.key, gridElement.i) }} >&#10754;</button>
          </div>
          <div onDoubleClick={() => { this.configureGridElement(tab, gridElement) }}>
          {component}
          </div>
          </div>
      );

  }


  renderGrid(tab) {
    var renderedLayout = [];
    for (var i = 0; i < tab.layout.length; i++) {
      var gridElement = tab.layout[i];
      renderedLayout.push(this.renderGridElement(tab, gridElement));
    };
    console.log("Layout ", renderedLayout);
    return renderedLayout;
  }


  renderControls(tab) {
    if (this.state.activeMenu === tab.key ) {
      return (
          <div>
            <div className="tabControls" >
              <button onClick={(e) => { this.onTabMenuHide(e, tab) }} >&#9652;</button>
            </div>
            <div className="dropDown" >
              <button onClick={(e) => { this.onAddClick(tab, "DataInstrument", 2, 1)}}>Add Databox</button>
              <button onClick={(e) => { this.onAddClick(tab, "WindInstrument", 10, 10)}}>Add Wind Instrument</button>
              <button onClick={(e) => { this.onAddClick(tab, "PolarInstrument", 10, 10)}}>Add Polar Instrument</button>
              <button onClick={(e) => { this.removeTab(tab)}}>Remove Tab</button>
            </div>
          </div>
        );
    } else {
      return (
          <div className="tabControls" >
            <button onClick={(e) => { this.onTabMenuShow(e, tab) }} >&#9662;</button>
          </div>
        );
    }
  }


  renderTab(n) {
    var tab = this.state.tabs[n];
    if ( this.state.editing === tab.key ) {
      return (<Tab key={tab.key} >
        <InlineEdit onDone={(value) => {this.onFinishTabEdit(tab, value)}} value={tab.title} /> 
        </Tab>
        );
    } else {
      return (
        <Tab key={tab.key} 
        onDoubleClick={(e) => {this.onStartTabEdit(e, tab)}} >
        {tab.title}
        {this.renderControls(tab)}
        </Tab>
        );
    }
  }

  renderTabs() {
    var tabs = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      tabs.push(this.renderTab(i));
    }
    return tabs;
  }
  renderPanel(tab) {
    return  (<TabPanel key={tab.key}>
          { (this.state.configuringTab === tab) && (<ConfigureGridElement 
              onDone={this.doneConfigureGridElement} 
              gridElement={this.state.configuringElement} />)}
          <ReactGridLayout className="layout" 
            layout={tab.layout} 
            onLayoutChange={(layout) => {this.onLayoutChange(layout, tab)}}
            cols={tab.cols} 
            rowHeight={tab.rowHeight} 
            width={tab.width}>

          {this.renderGrid(tab)}
          </ReactGridLayout>
        </TabPanel>);
  }
  renderPanels() {
    var panels = [];
    for (var i = 0; i < this.state.tabs.length; i++) {
      panels.push(this.renderPanel(this.state.tabs[i]));
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