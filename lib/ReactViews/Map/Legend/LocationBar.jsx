"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import React from "react";
import Styles from "./legend.scss";

const LocationBar = observer(
  createReactClass({
    displayName: "LocationBar",

    propTypes: {
      terria: PropTypes.object,
      showUtmZone: PropTypes.bool,
      mouseCoords: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    getDefaultProps: function() {
      return {
        showUtmZone: true
      };
    },

    toggleUseProjection() {
      this.props.mouseCoords.toggleUseProjection();
    },

    render() {
      const { t } = this.props;
      return (
        <button
          type="button"
          className={classNames(Styles.locationBar, {
            [Styles.useProjection]: this.props.mouseCoords.useProjection
          })}
          onClick={this.toggleUseProjection}
          css={`
            &:hover {
              background: ${p => p.theme.colorPrimary};
            }
          `}
        >
          <Choose>
            <When condition={!this.props.mouseCoords.useProjection}>
              <div className={Styles.section}>
                <span>{t("legend.lat")}</span>
                <span>{this.props.mouseCoords.latitude}</span>
              </div>
              <div className={Styles.section}>
                <span>{t("legend.lon")}</span>
                <span>{this.props.mouseCoords.longitude}</span>
              </div>
            </When>
            <Otherwise>
              <div className={Styles.sectionShort}>
                <span>{t("legend.zone")}</span>
                <span>{this.props.mouseCoords.utmZone}</span>
              </div>
              <div className={Styles.section}>
                <span>{t("legend.e")}</span>
                <span>{this.props.mouseCoords.east}</span>
              </div>
              <div className={Styles.section}>
                <span>{t("legend.n")}</span>
                <span>{this.props.mouseCoords.north}</span>
              </div>
            </Otherwise>
          </Choose>
        </button>
      );
    }
  })
);

module.exports = withTranslation()(LocationBar);
