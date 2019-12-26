/*jshint node:true */
"use strict";

import React from 'react';
import  ReactGridLayout from 'react-grid-layout';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import WindInstrument from './WindInstrument.jsx';
import StripChart from './StripChart.jsx';
import Course from './Course.jsx';
import PolarInstrument from './PolarInstrument.jsx';
import DataInstrument from './DataInstrument.jsx';
import InlineEdit from './InlineEdit.jsx';
import ConfigureCell from './ConfigureCell.jsx';
import LayoutRaw from './LayoutRaw.jsx';
import _ from "lodash";
import utils from './utils.jsx'; 
import './react-tabs.css';


/**
 * This class controls the layout which is saved to the local storage of the client on every change. 
 * Saving to the local storage allows multiple clients to be run each with their own unique configuration
 * from the same server, without having to implement complex configuation management on the server.
 * they layout consists of global properties and a layout containing tabs and cells. All have properties.
 * valuous screens some controlled by the components manipulate the layout which gets saved and causes 
 * components to be updated. All changes to the layout are pushed to a bacon bus for components to subscribe 
 * to if required, for instance, the LayouRaw component subscribes to that bus and displays the raw layout
 * which can be manually edited. 
 */

class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
    this.key = new Date().getTime();
    this.namedComponents = {
      WindInstrument: WindInstrument,
      PolarInstrument: PolarInstrument,
      DataInstrument: DataInstrument,
      LayoutRaw: LayoutRaw,
      StripChart: StripChart,
      Course: Course,
    };
    // register the layout with the app so that components can be registered.
    this.app.registerLayout(this);

    // layout contains the state, in serialisable form.
    // the name of the components must either be a html element or must be present in the namedComponents 
    // registered with layout.
    // for the moment hard code this, although a settings fialog would allow components to be added.
    // each component must exist inside its own div. Components cant share svg space.
    this.state = {
      skinClass: "cs_normal",
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
    var savedState = utils.loadLocalDataItem("layout");
    if ( savedState ) {
      this.state = savedState;
    }
    this.initialiseTabs(this.state.tabs);
    document.body.className = this.state.skinClass || "cs_normal";
    // must attach anyFunctions to the saved state.
    this.doneConfigureCell = this.doneConfigureCell.bind(this);

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
        cols: 20,
        rowHeight: 60,
        width: 1200,
        title: 'unamed'        
      });
    this.setState({tabs: newTabs});      
  }

  /**
   * Initialises all components adding default properties, like functions if missing.
   */
  initialiseTabs(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      var layout = tabs[i].layout;
      for (var j = 0; j < layout.length; j++) {
        var componentName =  layout[j].contents.name;
        if ( typeof this.namedComponents[componentName].updateDefaultProperties === 'function') {
          this.namedComponents[componentName].updateDefaultProperties(this.app, tabs[i], layout[j]);
        } 
      };
    };
  }


  /**
   * Update an immutable item from a [] of items keyed, by a key which 
   * must match the target. The udpateItemCB is called with a fresh 
   * shallow clone of the item which the implementation of that function
   * should either modify and return, or, if it is to be deleted, return undefined.
   * This function can be chained to gether to edit an immutable tree.
   * callbacks should be synchronous.
   */
  updateItem(items, key, target, updateItemCB) {
    var newItems = [];
    for (var i = 0; i < items.length; i++) {
      if ( items[i][key] === target[key] ) {
        var newItem = updateItemCB(_.clone(items[i]));
        if ( newItem !== undefined ) {
          newItems.push(newItem);
        }
      } else {
        newItems.push(items[i]);
      }
    }
    return newItems;
  }

  removeCell(tab, cell) {
    if ( !this.props.locked ) {
      var self = this;
      self.setState({tabs: self.updateItem(self.state.tabs, "key", tab, (newTab)=> {
        newTab.layout = self.updateItem(newTab.layout, "i", cell, (newCell) => {
          console.log("Removing ", newTab.key, cell.i, newCell);
          return undefined;
        });
        console.log("Updated Tab ", newTab);
        return newTab;
      })});          
    }
  }

  removeTab(tab) {
    var self = this;
    self.setState({
      tabs: self.updateItem(self.state.tabs, "key", tab, (newTab) => {
          return undefined;
        }),
      activeMenu: undefined
    });
  }


  onAddClick(tab, componentName, width, height) {
    var self = this;
    self.setState({
      tabs: self.updateItem(self.state.tabs, "key", tab, (newTab) => {
        newTab.layout = newTab.layout.slice();
        self.key++;
        var layout = { i: ""+this.key, x:0,  y:0, w:width, h:height, contents: { name: componentName, props: {} } };
        if ( typeof self.namedComponents[componentName].updateDefaultProperties === 'function') {
          self.namedComponents[componentName].updateDefaultProperties(this.app, newTab, layout);
        } 
        newTab.layout.push(layout);
        return newTab;
      }),
      activeMenu: undefined
    });
  }

  onLayoutChange(layout, tab) {
    var self = this;
    self.setState({tabs: self.updateItem(self.state.tabs, "key", tab, (newTab) => {
        var layoutByKey = {};
        for (var j = 0; j < layout.length; j++) {
          layoutByKey[layout[j].i] = layout[j];
        }
        for (var j = 0; j < newTab.layout.length; j++) {
          // if the width and height have changed
          var componentName =  newTab.layout[j].contents.name;
          var newLayout = layoutByKey[newTab.layout[j].i];
          // copy the existing contents over.
          newLayout.contents = newTab.layout[j].contents;
          // update anything else.
          if ( typeof self.namedComponents[componentName].updateLayoutContents === 'function') {
            self.namedComponents[componentName].updateLayoutContents(this.app, newTab, newLayout);
          } 
        }        
        newTab.layout = layout;
        return newTab;
    })});
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
    this.app.configBus.push(this.state);
    utils.saveLocalData("layout",this.state);
  }



  onStartTabEdit(event, tab) {
    if ( this.state.editing === undefined) {
      this.setState({
        editing: tab.key
      });
    }
    event.preventDefault();
  }

  onFinishTabEdit(tab, value) {
    var self = this;
    self.setState({tabs: self.updateItem(self.state.tabs, "key", { key: self.state.editing}, (newTab) => {
        newTab.title = value;
        return newTab;
      }),
      editing: undefined
    });    
  }


  configureCell(tab, cell) {
    console.log("Would configure ", cell);
    this.setState({
      configuringCell: cell,
      configuringTab: tab
    });
  }

  doneConfigureCell(finalConfig) {
    if (finalConfig !== undefined) {
      if ( this.state.configuringTab === "_global") {
        this.state.configuringCell.update(finalConfig);
        console.log("Done global config", finalConfig);
        this.setState({
          configuringCell: undefined,
          configuringTab: undefined
        });      
      } else {
        console.log("Done configure ", finalConfig);
        var self = this;
        var newTabs = self.updateItem(self.state.tabs, "key", self.state.configuringTab, (newTab)=> {
          newTab.layout = self.updateItem(newTab.layout, "i", self.state.configuringCell, (newCell) => {
            newCell.contents = _.clone(newCell.contents);
            newCell.contents.props = _.clone(finalConfig);
            console.log("Updated  cell",newCell);
            return newCell;
          });
          return newTab;
        });            
        console.log("Updated Tabs ", newTabs);
        this.setState({
          tabs: newTabs,
          configuringCell: undefined,
          configuringTab: undefined
        });      
      }
    } else {
      this.setState({
        configuringCell: undefined,
        configuringTab: undefined
      });      
    }
  }

 
  configureGlobal() {
    var self = this;
    var sourcePriority = this.state.sourceIdPreferences || [];
    sourcePriority = sourcePriority.join(",");
    var polarSourceUri = this.state.polarSourceUri || "pogo1250";
    var signalkUrl = this.state.signalkUrl || "default";
    var skinClass = this.state.skinClass || "cs_normal";
    var knownSource = [];
    var knownKeys = this.app.knownKeys;
    for(var k in knownKeys ) {
      if ( knownKeys[k] !== undefined && knownKeys[k].sourceId !== undefined)
      var sourceId = knownKeys[k].sourceId;
      if ( sourceId !== "_preferred" && knownSource.indexOf(sourceId) < 0 ) {
        knownSource.push(sourceId);
      }
    }
    // TODO: get a list of polars rather than have the user work out what they are ?
    // However, we could also let the user enter any name and load it or not.
    this.configureCell("_global", {
      contents: {
        props: {
          signalkUrl: {
            value: signalkUrl,
            title: "Signal K URL eg http://localhost:3000",
            help: "URL where the SignalK server is running"
          },
          sourcePriority: {
            value: sourcePriority,
            title: "Source Priority list",
            help: "comma seperated list of source Ids. Prefered should be first. Known sources are "+knownSource.join(",")
          },
          polarSURL: {
            value: polarSourceUri,
            title: "Polar performance source",
            help: "Name of the polar file shipped with the app, leave blank for default (pogo1250), or use a url eg /examples/j109polar.json, see https://github.com/ieb/sailinstruments/tree/master/src/components/calcs/polar/README.md "
          },
          skinClass: {
            value: skinClass,
            choices: {
              cs_normal: "Normal",
              cs_invert: "Inverted",
              cs_night: "Night"
            },
            title: "Display colour scheme",
            help: "Select the color scheme used for the display"
          }
        }
      },
      update: (update) => {
        console.log("Got Update ",update);
        document.body.className = update.skinClass.value;
        self.setState({
          sourceIdPreferences: update.sourcePriority.value.replace(/\s/g,"").split(","),
          signalkUrl: update.signalkUrl.value,
          polarSourceUri: update.polarSURL.value,
          skinClass: update.skinClass.value
        });
      }
    });
  }




  updateLayout(layoutData) {
    this.setState(layoutData);
  }


  renderCell(tab, cell) {
    var component = this.namedComponents[cell.contents.name].generateComponent(cell.contents.props, this.app);
    if ( this.props.locked ) {
      return (
          <div key={cell.i} >
          <div className={cell.contents.className} onDoubleClick={() => { this.configureCell(tab, cell) }}>
          {component}
          </div>
          </div>
      );
    } else {
      return (
          <div key={cell.i} >
          <div className={cell.contents.className} onDoubleClick={() => { this.configureCell(tab, cell) }}>
          {component}
          </div>
          <div className="cellControls" >
          <button 
            onClick={() => { this.removeCell(tab, cell) }} >&#10754;</button>
          </div>
          </div>
      );
    }

  }


  renderGrid(tab) {
    var renderedLayout = [];
    for (var i = 0; i < tab.layout.length; i++) {
      var cell = tab.layout[i];
      renderedLayout.push(this.renderCell(tab, cell));
    };
    return renderedLayout;
  }


  renderControls(tab) {
    if (this.state.activeMenu === tab.key  ) {
      return (
          <div>
            <div className="dropDown" >
              <button onClick={(e) => { this.onAddClick(tab, "DataInstrument", 4, 2)}}>Add Databox</button>
              <button onClick={(e) => { this.onAddClick(tab, "WindInstrument", 10, 10)}}>Add Wind Instrument</button>
              <button onClick={(e) => { this.onAddClick(tab, "PolarInstrument", 10, 10)}}>Add Polar Instrument</button>
              <button onClick={(e) => { this.onAddClick(tab, "StripChart", 10, 4)}}>Add Strip Chart</button>
              <button onClick={(e) => { this.onAddClick(tab, "LayoutRaw", 10, 10)}}>Add Layout Editor</button>
              <button onClick={(e) => { this.onAddClick(tab, "Course", 10, 10)}}>Race Course Planner</button>
              <button onClick={(e) => { this.removeTab(tab)}}>Remove Tab</button>
            </div>
            <div className="tabControls" >
              <button onClick={(e) => { this.onTabMenuHide(e, tab) }} >&#9652;</button>
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


  renderTab(tab) {
    if ( this.props.locked ) {
      return (
        <Tab key={tab.key}  >
        {tab.title}
        </Tab>
      );
    } else if ( this.state.editing === tab.key ) {
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
      tabs.push(this.renderTab(this.state.tabs[i]));
    }
    return tabs;
  }
  renderPanel(tab) {
    return  (<TabPanel key={tab.key}>
          { (this.state.configuringTab === tab) && (<ConfigureCell 
              onDone={this.doneConfigureCell} 
              cell={this.state.configuringCell} 
              app={this.app} />)}
          <ReactGridLayout className="layout" 
            layout={tab.layout} 
            onLayoutChange={(layout) => {this.onLayoutChange(layout, tab)}}
            cols={tab.cols} 
            rowHeight={tab.rowHeight} 
            width={tab.width}
            isDraggable={!this.props.locked}
            isResizable={!this.props.locked}
            >

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

  renderGlobalConfig() {
    if (this.state.configuringTab === "_global") {
      return (<ConfigureCell onDone={this.doneConfigureCell} cell={this.state.configuringCell} app={this.app} />);
    } 
    return "";
  }

  render() {
    return (
      <Tabs>
        <TabList>
          {this.renderTabs()}
        </TabList>
        {this.renderGlobalConfig()}
        {this.renderPanels()}
      </Tabs>
    );
  }

}

export default Layout;