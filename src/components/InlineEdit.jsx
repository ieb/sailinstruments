/*jshint node:true */
"use strict";

import React from 'react';


class InlineEdit extends React.Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      value: props.value
    };
    this.onDone = this.onDone.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  onValueChange(event) {
    this.setState({
      value: event.target.value
    });    
  }

  onDone(event) {
    this.props.onDone(this.state.value);
    event.preventDefault();
    return false;
  }

  render() {
    return (
      <form onSubmit={this.onDone} >
        <input type="text" value={this.state.value} onChange={this.onValueChange}/>
      </form>
    );
  }

}

export default InlineEdit;