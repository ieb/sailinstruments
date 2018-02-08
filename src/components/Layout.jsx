/*jshint node:true */
"use strict";

import React from 'react';
import  ReactGridLayout from 'react-grid-layout';
import WindInstrument from './WindInstrument.jsx';
import PolarInstrument from './PolarInstrument.jsx';


class Layout extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.app = props.app;
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
      layout : [
        { i: "wind", x:0,  y:1, w:1, h:1, contents: { name: "WindInstrument", props : { northup: false }} },
        { i: "polar", x:1,  y:1, w:1, h:1, contents: { name: "PolarInstrument", props: {}} }
      ],
      cols: 2,
      rowHeight: 600,
      width: 1200
    };
  }

  registerComponent(name, constructor) {
    this.namedComponents[name]= constructor;
  }



  renderGrid() {
    var renderedLayout = [];
    for (var i = 0; i < this.state.layout.length; i++) {
      var gridElement = this.state.layout[i];
      console.log("GridElement ", gridElement);
      var props = gridElement.contents.props;
      props.app = this.app;
      var component = React.createElement(this.namedComponents[gridElement.contents.name], props);
      renderedLayout.push((<div key={gridElement.i} >{component}</div>));
    };
    console.log("Layout ", renderedLayout);
    return renderedLayout;
  }

  render() {
    return (
      <ReactGridLayout className="layout" layout={this.state.layout} cols={this.state.cols} rowHeight={this.state.rowHeight} width={this.state.width}>
      {this.renderGrid()}
      </ReactGridLayout>
    );
  }

}

export default Layout;