/*jshint node:true */
"use strict";

import React from 'react';

class TemplateComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        somestate : 0
    };
    this.onSomeEvent = this.onSomeEvent.bind(this);
  }

  onSomeEvent () {
    let newSomeState = this.state.somestate + 1;
    this.setState({somestate: newSomeState});
  }

  render() {
    return (
      <div>
        Likes : <span>{this.state.somestate}</span>
        <div><button onClick={this.onSomeEvent}>Like Me</button></div>
      </div>
    );
  }

}

export default TemplateComponent;