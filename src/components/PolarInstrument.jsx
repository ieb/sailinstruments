/*jshint node:true */
"use strict";

import React from 'react';
import InstrumentContainer from './InstrumentContainer.jsx';
import PolarChart from './PolarChart.jsx';

class PolarInstrument extends React.Component {

  constructor(props) {
    super(props);
    this.app = props.app;
    this.state = {
    };
  }


  render() {

    return (
        <InstrumentContainer width="600" height="600" translate="10,10" >
          <PolarChart app={this.app} />
        </InstrumentContainer>

    );
  }

}

export default PolarInstrument;