import React, { Component } from "react";
import cx from "classnames/bind";

import { strings } from "../helpers/settings";

export default class Alert extends Component {
  render() {
    let message = null;
    if (this.props.state.error) {
      message = strings.alerts[this.props.state.error];
    } else if (this.props.state.alert) {
      message = strings.alerts[this.props.state.alert];
    }
    return (
      <div
        className={cx("alert", {
          "alert-danger": this.props.state.error,
          "alert-warning": this.props.state.alert && !this.props.state.error,
          "d-none": !message
        })}
      >
        {message}
      </div>
    );
  }
}
