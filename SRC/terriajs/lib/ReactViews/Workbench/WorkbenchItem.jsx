"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { sortable } from "react-anything-sortable";
import { withTranslation } from "react-i18next";
import getPath from "../../Core/getPath";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import CommonStrata from "../../Models/Definition/CommonStrata";
import { DEFAULT_PLACEMENT } from "../../Models/SelectableDimensions";
import Box from "../../Styled/Box";
import Icon from "../../Styled/Icon";
import Slider from "rc-slider";
import { Range } from "rc-slider";
import Loader from "../Loader";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import ChartItemSelector from "./Controls/ChartItemSelector";
import ColorScaleRangeSection from "./Controls/ColorScaleRangeSection";
import DateTimeSelectorSection from "./Controls/DateTimeSelectorSection";
import DimensionSelectorSection from "./Controls/DimensionSelectorSection";
import FilterSection from "./Controls/FilterSection";
import LeftRightSection from "./Controls/LeftRightSection";
import Legend from "./Controls/Legend";
import OpacitySection from "./Controls/OpacitySection";
import SatelliteImageryTimeFilterSection from "./Controls/SatelliteImageryTimeFilterSection";
import { ScaleWorkbenchInfo } from "./Controls/ScaleWorkbenchInfo";
import ShortReport from "./Controls/ShortReport";
import TimerSection from "./Controls/TimerSection";
import ViewingControls from "./Controls/ViewingControls";
import Styles from "./workbench-item.scss";
import DefaultTimelineModel from "../../Models/DefaultTimelineModel";
import CameraView from "../../Models/CameraView";
import {
  checkIfColorControlableByRange,
  getColorControlableByRangeInfo,
  checkIfDynamiColorBuiding,
  getDynamiColorBuidingInfo,
  checkIfOpacityControlable,
  getTimelineInfo,
  getInitialCameraInfo,
  getSwitchableUrls,
  checkIfSwitchableStyles
} from "../../ViewModels/workbenchFuncitons";
import StorySection from "./Controls/StorySection";
import Spacing from "../../Styled/Spacing";
import OpendataSection from "./Controls/OpendataSection";

export const WorkbenchItemRaw = observer(
  createReactClass({
    displayName: "WorkbenchItem",

    propTypes: {
      style: PropTypes.object,
      className: PropTypes.string,
      onMouseDown: PropTypes.func.isRequired,
      onTouchStart: PropTypes.func.isRequired,
      item: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      terria: PropTypes.object.isRequired,
      setWrapperState: PropTypes.func,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        dynamicColorStyle: "style1",
        opacity: 1.0,
        urlIndex: 0,
        switchableUrls: getSwitchableUrls(this.props.item),
        isDynamicColorBuilding: checkIfDynamiColorBuiding(this.props.item),
        isSwitchableStyles: checkIfSwitchableStyles(this.props.item),
        isOpacityControlable: checkIfOpacityControlable(this.props.item),
        ...this.getDynamicColorState(this.props.item),
        isColorControlableByRange: checkIfColorControlableByRange(
          this.props.item
        ),
        colorControrableProperties: getColorControlableByRangeInfo(
          this.props.item
        ),
        colorRangeMax: 0,
        corlorRangeFrom: 0,
        corlorRangeTo: 0,
        colorRangeColor: "",
        colorRange: {
          property: "",
          min: 0,
          max: 0
        }
      };
    },

    getDynamicColorState(workbenchItem) {
      let dynamicColorStyles = {};
      let dynamicColors = [];

      if (checkIfSwitchableStyles(workbenchItem)) {
        workbenchItem.customProperties.switchableStyles.forEach(
          (obj, index) => {
            const styleKey = `style${index + 1}`;
            dynamicColorStyles[styleKey] = {
              style: obj.style,
              legend: obj.legend,
              legendCSS: obj.legendCSS
            };

            dynamicColors.push({ label: obj.name, value: styleKey });
          }
        );
      } else {
        let inundationRankings = getDynamiColorBuidingInfo(workbenchItem);
        if (!inundationRankings) {
          inundationRankings = [];
        }

        dynamicColorStyles = {
          style1: {
            style: {
              color: {
                conditions: [["true", "color('#FFFFFF', 1.0)"]]
              }
            },
            legend: ""
          },
          style2: {
            style: {
              color: {
                conditions: [
                  ["isNaN(${計測高さ})", "color('#FFFFFF', 1.0)"],
                  ["${計測高さ} === null", "color('#FFFFFF', 1.0)"],
                  ["${計測高さ} < 13.0", "color('#382A54', 1.0)"],
                  ["${計測高さ} < 32.0", "color('#5A22C8', 1.0)"],
                  ["${計測高さ} < 61.0", "color('#A675BE', 1.0)"],
                  ["${計測高さ} < 101.0", "color('#F0D37B', 1.0)"],
                  ["${計測高さ} < 181.0", "color('#FFCD00', 1.0)"],
                  ["true", "color('#F7FF00', 1.0)"]
                ]
              }
            },
            legend: "/images/legend_buildingheight_v2.png",
            legendCSS: `width: 100px`
          }
        };

        dynamicColors = [
          { label: "色分けなし", value: "style1" },
          { label: "建物高さ", value: "style2" }
        ];

        let idx = 2;
        for (const r of inundationRankings) {
          idx++;

          dynamicColorStyles[`style${idx}`] = {
            style: {
              color: {
                conditions: [
                  ["isNaN(${" + r.property + "})", "color('#FFFFFF', 1.0)"],
                  ["${" + r.property + "} === null", "color('#FFFFFF', 1.0)"],
                  ["${" + r.property + "} < 2", "color('#F7F5A9', 1.0)"],
                  ["${" + r.property + "} < 3", "color('#FFD8C0', 1.0)"],
                  ["${" + r.property + "} < 4", "color('#FFB7B7', 1.0)"],
                  ["${" + r.property + "} < 5", "color('#FF9191', 1.0)"],
                  ["${" + r.property + "} < 6", "color('#F285C9', 1.0)"],
                  ["${" + r.property + "} < 7", "color('#DC70DC', 1.0)"],
                  ["true", "color('#FFFFFF', 1.0)"]
                ]
              }
            },
            legend: "/images/legend_waterfloodrank2.png",
            legendCSS: `width: 300px`
          };

          dynamicColors.push({ label: r.label, value: `style${idx}` });
        }
      }

      return {
        dynamicColorStyles: dynamicColorStyles,
        dynamicColors: dynamicColors
      };
    },

    toggleDisplay() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "isOpenInWorkbench",
          !this.props.item.isOpenInWorkbench
        );
      });
    },

    openModal() {
      this.props.setWrapperState({
        modalWindowIsOpen: true,
        activeTab: 1,
        previewed: this.props.item
      });
    },

    toggleVisibility() {
      runInAction(() => {
        this.props.item.setTrait(
          CommonStrata.user,
          "show",
          !this.props.item.show
        );
      });
    },

    setUrlIndex(e) {
      this.setState({ urlIndex: e.target.value });
    },

    setColorRangeProperty(e) {
      const ccp = this.state.colorControrableProperties.find(
        x => x.property === e.target.value
      );
      if (ccp) {
        runInAction(() => {
          this.setState({
            colorRange: {
              property: ccp.property,
              min: ccp.min,
              max: ccp.max,
              unit: ccp.unit ? ccp.unit : "",
              color: ccp.color,
              from: ccp.min,
              to: ccp.max
            }
          });
        });
      } else {
        runInAction(() => {
          this.setState({
            colorRange: {
              property: "",
              min: 0,
              max: 100
            }
          });
        });
      }
    },

    setColorRangeFromToState(values) {
      if (!this.state.colorRange.property) {
        return;
      }
      runInAction(() => {
        this.setState({
          colorRange: Object.assign({}, this.state.colorRange, {
            from: values[0],
            to: values[1]
          })
        });
      });
    },

    setDynamicColorStyle(e) {
      runInAction(() => {
        this.setState({ dynamicColorStyle: e.target.value });
        this.colorBuildings();
      });
    },

    colorBuildings() {
      let style = this.state.dynamicColorStyles[this.state.dynamicColorStyle]
        .style;
      if (checkIfOpacityControlable(this.props.item)) {
        style = this.getOpacityAppliedStyle(style);
      }
      this.props.item.setTrait(CommonStrata.user, "style", style);
    },

    setOpacityState(value) {
      this.setState({ opacity: value });
    },

    getOpacityAppliedStyle(style) {
      if (!style || !style.color) {
        return null;
      }

      const newConditions = [];
      if (style.color.conditions) {
        for (const cdn of style.color.conditions) {
          if (!cdn || !cdn.length) {
            break;
          }
          const colorValues = cdn[1].split(",");
          if (!cdn[0].match(/\${always_show}\s*>\s*0/)) {
            colorValues[1] = `${this.state.opacity} )`;
          }
          newConditions.push([cdn[0], colorValues.join(",")]);
        }
      }

      return Object.assign({}, style, { color: { conditions: newConditions } });
    },

    setTimeLine() {
      const timelineInfo = getTimelineInfo(this.props.item);
      if (!timelineInfo) {
        return;
      }
      runInAction(() => {
        const timeModel = new DefaultTimelineModel();
        timeModel.setTrait(
          CommonStrata.defaults,
          "startTime",
          timelineInfo.start
        );

        timeModel.setTrait(
          CommonStrata.defaults,
          "stopTime",
          timelineInfo.stop
        );

        timeModel.setTrait(
          CommonStrata.defaults,
          "currentTime",
          timelineInfo.start
        );

        timeModel.setTrait(
          CommonStrata.defaults,
          "multiplier",
          timelineInfo.multiplier ? timelineInfo.multiplier : 60.0
        );
        this.props.terria.timelineStack.defaultTimeVarying = timeModel;
      });
    },

    setInitialCamera() {
      const initialCameraInfo = getInitialCameraInfo(this.props.item);
      if (!initialCameraInfo) {
        return;
      }

      const initialCamera = CameraView.fromJson(initialCameraInfo);
      this.props.terria.currentViewer.zoomTo(initialCamera, 2.0);
      return true;
    },

    onClickItem() {
      this.setTimeLine();
    },

    zoomTo() {
      if (this.setInitialCamera()) {
        return;
      }
      const viewer = this.props.viewState.terria.currentViewer;
      const item = this.props.item;
      let zoomToView = item;
      if (
        item.rectangle !== undefined &&
        item.rectangle.east - item.rectangle.west >= 360
      ) {
        zoomToView = this.props.viewState.terria.mainViewer.homeCamera;
        console.log("Extent is wider than world so using homeCamera.");
      }
      viewer.zoomTo(zoomToView);
    },

    componentDidMount() {
      if (this.props.item.type == "3d-tiles") {
        runInAction(() => {
          this.props.item.setTrait(
            CommonStrata.user,
            "highlightColor",
            "#D54A4A"
          );
        });
      }
      this.setTimeLine();
      this.setInitialCamera();
      if (this.state.isColorControlableByRange) {
        reaction(
          () => this.state.colorRange,
          colorRange => {
            this.applyColorRange(colorRange);
          }
        );
      }
    },

    applyColorRange(cr) {
      let controledColor;
      if (cr.property) {
        const prop = "${" + cr.property + "}";
        controledColor = {
          conditions: [
            [`isNaN(${prop})`, "color('#FFFFFF', 1.0)"],
            [`${prop} === null`, "color('#FFFFFF', 1.0)"],
            [`${prop} < ${cr.from}`, "color('#FFFFFF', 1.0)"],
            [`${prop} <= ${cr.to}`, `color${cr.color}`],
            ["true", "color('#FFFFFF', 1.0)"]
          ]
        };
      } else {
        controledColor = {
          conditions: [["true", "color('#FFFFFF', 1.0)"]]
        };
      }

      let ccpStyle = { color: controledColor };
      if (this.state.isOpacityControlable) {
        ccpStyle = this.getOpacityAppliedStyle(ccpStyle);
      }
      window.sstyle = ccpStyle;
      runInAction(() => {
        this.props.item.setTrait(CommonStrata.user, "style", ccpStyle);
      });
    },

    componentDidUpdate(prevProps, prevState) {
      if (this.state.opacity !== prevState.opacity) {
        const style = this.getOpacityAppliedStyle(this.props.item.style);
        if (style) {
          runInAction(() => {
            this.props.item.setTrait(CommonStrata.user, "style", style);
          });
        }
      }

      if (
        this.state.switchableUrls &&
        this.state.urlIndex !== prevState.urlIndex
      ) {
        runInAction(() => {
          this.props.item.setTrait(
            CommonStrata.user,
            "url",
            this.state.switchableUrls[this.state.urlIndex].url
          );
          this.props.item.loadMapItems();
        });
      }
    },

    render() {
      const workbenchItem = this.props.item;
      const { t } = this.props;
      const isLoading =
        (CatalogMemberMixin.isMixedInto(this.props.item) &&
          this.props.item.isLoading) ||
        (ReferenceMixin.isMixedInto(this.props.item) &&
          this.props.item.isLoadingReference);

      const isSwitchableColor =
        this.state.isDynamicColorBuilding || this.state.isSwitchableStyles;
      const isColorControlableByRange = this.state.isColorControlableByRange;
      const isOpacityControlable = this.state.isOpacityControlable;

      if (isSwitchableColor) {
        this.colorBuildings();
      }

      const opacity = this.state.opacity;
      const switchableUrls = this.state.switchableUrls;

      return (
        <li
          style={this.props.style}
          className={classNames(this.props.className, Styles.workbenchItem, {
            [Styles.isOpen]: workbenchItem.isOpenInWorkbench
          })}
          css={`
            color: ${p => p.theme.textLight};
            background: ${p => p.theme.darkWithOverlay};
          `}
          onClick={this.onClickItem}
        >
          <Box fullWidth justifySpaceBetween padded>
            <Box>
              <If condition={true || workbenchItem.supportsToggleShown}>
                <Box
                  leftSelf
                  className={Styles.visibilityColumn}
                  css={`
                    padding: 3px 5px;
                  `}
                >
                  <button
                    type="button"
                    onClick={this.toggleVisibility}
                    title={t("workbench.toggleVisibility")}
                    className={Styles.btnVisibility}
                  >
                    {workbenchItem.show ? (
                      <Icon glyph={Icon.GLYPHS.eye2} />
                    ) : (
                      <Icon glyph={Icon.GLYPHS.eye2Closed} />
                    )}
                  </button>
                </Box>
              </If>
            </Box>
            <Box className={Styles.nameColumn}>
              <Box fullWidth paddedHorizontally>
                <div
                  onMouseDown={this.props.onMouseDown}
                  onTouchStart={this.props.onTouchStart}
                  className={Styles.draggable}
                  title={getPath(workbenchItem, " → ")}
                >
                  <If condition={!workbenchItem.isMappable && !isLoading}>
                    <span className={Styles.iconLineChart}>
                      <Icon glyph={Icon.GLYPHS.lineChart} />
                    </span>
                  </If>
                  {workbenchItem.name}
                </div>
              </Box>
            </Box>
            <Box>
              <Box className={Styles.toggleColumn} alignItemsFlexStart>
                <button
                  type="button"
                  className={Styles.btnToggle}
                  onClick={this.toggleDisplay}
                  css={`
                    display: flex;
                    min-height: 24px;
                    align-items: center;
                    padding: 5px;
                  `}
                >
                  {workbenchItem.isPrivate && (
                    <Box paddedHorizontally>
                      <PrivateIndicator inWorkbench />
                    </Box>
                  )}
                  {workbenchItem.isOpenInWorkbench ? (
                    <Icon glyph={Icon.GLYPHS.opened} />
                  ) : (
                    <Icon glyph={Icon.GLYPHS.closed} />
                  )}
                </button>
              </Box>
              <div className={Styles.headerClearfix} />
            </Box>
          </Box>

          <If condition={workbenchItem.isOpenInWorkbench}>
            <div className={Styles.inner}>
              <ViewingControls
                item={workbenchItem}
                viewState={this.props.viewState}
                setInitialCamera={this.setInitialCamera}
              />
              <Spacing bottom={2} />
              <OpendataSection item={workbenchItem} />
              <StorySection
                item={workbenchItem}
                viewState={this.props.viewState}
              />

              {/* カスタマイズした透過度スライダーや、switchableStyleとバッティングするので削除
               <OpacitySection item={workbenchItem} />
              */}

              <ScaleWorkbenchInfo item={workbenchItem} />
              <LeftRightSection item={workbenchItem} />
              <TimerSection item={workbenchItem} />
              <ChartItemSelector item={workbenchItem} />
              <FilterSection item={workbenchItem} />

              <If condition={isOpacityControlable}>
                <div className={"layer-opacity-section tjs-_base__clearfix"}>
                  <div>
                    <label htmlFor={this.props.item.name + "_透明度"}>
                      透明度:
                    </label>
                    <Slider
                      value={opacity}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      onChange={this.setOpacityState}
                    />
                  </div>
                </div>
              </If>

              {/* <DateTimeSelectorSection item={workbenchItem} /> */}
              <SatelliteImageryTimeFilterSection item={workbenchItem} />
              <DimensionSelectorSection
                item={workbenchItem}
                placement={DEFAULT_PLACEMENT}
              />
              <ColorScaleRangeSection
                item={workbenchItem}
                minValue={workbenchItem.colorScaleMinimum}
                maxValue={workbenchItem.colorScaleMaximum}
              />

              <If condition={switchableUrls}>
                <div
                  css={`
                    margin: 5px 0;
                  `}
                >
                  <For each="su" index="i" of={switchableUrls}>
                    <div key={i}>
                      <label>
                        <input
                          type="radio"
                          value={i}
                          onChange={this.setUrlIndex}
                          checked={this.state.urlIndex == i}
                        />
                        {su.label}
                      </label>
                    </div>
                  </For>
                </div>
              </If>
              <If condition={isColorControlableByRange}>
                <div
                  css={`
                    margin: 5px 0;
                  `}
                >
                  <div>色分け</div>
                  <label>
                    <input
                      type="radio"
                      value={""}
                      onChange={this.setColorRangeProperty}
                      checked={this.state.colorRange.property == ""}
                    />
                    色分けなし
                  </label>

                  <For
                    each="ccp"
                    index="i"
                    of={this.state.colorControrableProperties}
                  >
                    <div key={i}>
                      <label>
                        <input
                          type="radio"
                          value={ccp.property}
                          onChange={this.setColorRangeProperty}
                          checked={
                            this.state.colorRange.property == ccp.property
                          }
                        />
                        {ccp.label}
                      </label>
                    </div>
                  </For>
                  <If condition={this.state.colorRange.property}>
                    <Range
                      value={[
                        this.state.colorRange.from,
                        this.state.colorRange.to
                      ]}
                      allowCross={false}
                      min={this.state.colorRange.min}
                      max={this.state.colorRange.max}
                      onChange={this.setColorRangeFromToState}
                    />
                    <div
                      className={classNames(
                        "workbenchitem-color-range-slider-minmax-label"
                      )}
                    >
                      <div>
                        {this.state.colorRange.min}
                        {this.state.colorRange.unit}
                      </div>
                      <div>
                        {this.state.colorRange.max}
                        {this.state.colorRange.unit}
                      </div>
                    </div>
                  </If>
                </div>
              </If>
              <If condition={isSwitchableColor}>
                <div
                  css={`
                    margin: 5px 0;
                  `}
                >
                  <div>色分け</div>
                  <For each="dc" index="i" of={this.state.dynamicColors}>
                    <div key={i}>
                      <label>
                        <input
                          type="radio"
                          value={dc.value}
                          onChange={this.setDynamicColorStyle}
                          checked={this.state.dynamicColorStyle == dc.value}
                        />
                        {dc.label}
                      </label>
                    </div>
                  </For>
                </div>
                <If
                  condition={
                    this.state.dynamicColorStyles[this.state.dynamicColorStyle]
                      .legend
                  }
                >
                  <div>
                    <img
                      src={
                        this.state.dynamicColorStyles[
                          this.state.dynamicColorStyle
                        ].legend
                      }
                      css={
                        this.state.dynamicColorStyles[
                          this.state.dynamicColorStyle
                        ].legendCSS
                      }
                    ></img>
                  </div>
                </If>
              </If>

              <If
                condition={
                  workbenchItem.shortReport ||
                  (workbenchItem.shortReportSections &&
                    workbenchItem.shortReportSections.length)
                }
              >
                <ShortReport item={workbenchItem} />
              </If>
              <Legend item={workbenchItem} />
              <DimensionSelectorSection
                item={workbenchItem}
                placement={"belowLegend"}
              />
              {isLoading ? (
                <Box paddedVertically>
                  <Loader light />
                </Box>
              ) : null}
            </div>
          </If>
        </li>
      );
    }
  })
);

export default sortable(withTranslation()(WorkbenchItemRaw));
