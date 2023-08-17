import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import Styles from "./desktop-header.scss";
import MenuBar from "../Map/MenuBar";
import Branding from "../SidePanel/Branding";

const DesktopHeader = createReactClass({
  propTypes: {
    terria: PropTypes.object.isRequired,
    version: PropTypes.string,
    displayOne: PropTypes.number, // pass in a number here to only show one item from brandBarElements
    allBaseMaps: PropTypes.array,
    animationDuration: PropTypes.number.isRequired,
    viewState: PropTypes.object.isRequired,
    customElements: PropTypes.object.isRequired
  },

  render() {
    return (
      <div className={Styles.header}>
        <Branding
          terria={this.props.terria}
          viewState={this.props.viewState}
          version={this.props.version}
        />
        <MenuBar
          terria={this.props.terria}
          viewState={this.props.viewState}
          allBaseMaps={this.props.allBaseMaps}
          menuItems={this.props.customElements.menu}
          menuLeftItems={this.props.customElements.menuLeft}
          animationDuration={this.props.animationDuration}
        />
      </div>
    );
  }
});

module.exports = DesktopHeader;
