"use strict";
const React = require("react");
const createReactClass = require("create-react-class");
const PropTypes = require("prop-types");
import Styles from "./full_screen_button.scss";
import classNames from "classnames";
import Icon from "../../Styled/Icon";
import { withTranslation } from "react-i18next";
import { observer } from "mobx-react";
import withControlledVisibility from "../HOCs/withControlledVisibility";
import { Category, ViewAction } from "../../Core/AnalyticEvents/analyticEvents";

// The button to make the map full screen and hide the workbench.
const FullScreenButton = observer(
  createReactClass({
    displayName: "FullScreenButton",

    propTypes: {
      terria: PropTypes.object,
      viewState: PropTypes.object.isRequired,
      btnText: PropTypes.string,
      minified: PropTypes.bool,
      animationDuration: PropTypes.number, // Defaults to 1 millisecond.
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        isActive: false
      };
    },

    toggleFullScreen() {
      this.props.viewState.setIsMapFullScreen(
        !this.props.viewState.isMapFullScreen
      );

      // log a GA event
      this.props.terria.analytics?.logEvent(
        Category.view,
        this.props.viewState.isMapFullScreen
          ? ViewAction.exitFullScreen
          : ViewAction.enterFullScreen
      );
    },

    renderButtonText() {
      const btnText = this.props.btnText ? this.props.btnText : null;
      if (this.props.minified) {
        if (this.props.viewState.isMapFullScreen) {
          return <Icon glyph={Icon.GLYPHS.right} />;
        } else {
          return <Icon glyph={Icon.GLYPHS.closeLight} />;
        }
      }
      return (
        <>
          <span>{btnText}</span>
          <Icon glyph={Icon.GLYPHS.right} />
        </>
      );
    },

    render() {
      const btnClassName = classNames(Styles.btn, {
        [Styles.isActive]: this.props.viewState.isMapFullScreen,
        [Styles.minified]: this.props.minified
      });
      const { t } = this.props;
      return (
        <div
          className={classNames(Styles.fullScreen, {
            [Styles.minifiedFullscreenBtnWrapper]: this.props.minified,
            [Styles.trainerBarVisible]: this.props.viewState.trainerBarVisible
          })}
        >
          {this.props.minified && (
            <label
              className={Styles.toggleWorkbench}
              htmlFor="toggle-workbench"
            >
              {this.props.btnText}
            </label>
          )}
          <button
            type="button"
            id="toggle-workbench"
            aria-label={
              this.props.viewState.isMapFullScreen
                ? t("sui.showWorkbench")
                : t("sui.hideWorkbench")
            }
            onClick={this.toggleFullScreen}
            className={btnClassName}
            title={
              this.props.viewState.isMapFullScreen
                ? t("sui.showWorkbench")
                : t("sui.hideWorkbench")
            }
          >
            {this.renderButtonText()}
          </button>
        </div>
      );
    }
  })
);
module.exports = withTranslation()(withControlledVisibility(FullScreenButton));
