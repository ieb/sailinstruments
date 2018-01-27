import React from 'react';
import {render} from 'react-dom';
import InstrumentContainer from './components/InstrumentContainer.jsx';
import CompassRose from './components/CompassRose.jsx';
import BoatRose from './components/BoatRose.jsx';
import SignalKClientConnector from './databus/SignalKClientConnector.jsx';
import './style.css';

import StreamBundle from './databus/streambundle.js';

class App extends React.Component {
  constructor(props) {
        super(props);
        this.databus = new StreamBundle();
  }
  render () {
    return (
        <div>
        <SignalKClientConnector databus={this.databus} autoconnect={true} connectHost="localhost:3000"/>
        <div className="fullbrightness">
            <InstrumentContainer width="400" height="400" >
                <CompassRose northup={true} databus={this.databus} />
                <BoatRose headup={false} databus={this.databus} />
            </InstrumentContainer>
        </div>
        </div>
    );
  }
}

render(<App/>, document.getElementById("react"));