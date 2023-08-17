import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import Icon, { StyledIcon } from "../../Styled/Icon";
import SearchBoxAndResults from "../Search/SearchBoxAndResults";
import Workbench from "../Workbench/Workbench";
import FullScreenButton from "./FullScreenButton";

import { useRefForTerria } from "../Hooks/useRefForTerria";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import Button from "../../Styled/Button";
import { runInAction } from "mobx";
import { getTimelineInfo } from "../../ViewModels/workbenchFuncitons";

const BoxHelpfulHints = styled(Box)``;

const ResponsiveSpacing = styled(Box)`
  height: 110px;
  // Hardcoded px value, TODO: make it not hardcoded
  @media (max-height: 700px) {
    height: 3vh;
  }
`;

function EmptyWorkbench(props) {
  const t = props.t;
  const HelpfulHintsIcon = () => {
    return (
      <StyledIcon
        glyph={Icon.GLYPHS.bulb}
        styledWidth={"14px"}
        styledHeight={"14px"}
        light
        css={`
          padding: 2px 1px;
        `}
      />
    );
  };

  return (
    <Text large textLight>
      {/* Hardcoded top to 150px for now for very very small screens
          TODO: make it not hardcoded */}
      <Box
        column
        fullWidth
        justifySpaceBetween
        styledHeight={"calc(100vh - 150px)"}
      >
        <Box centered column>
          <ResponsiveSpacing />
          <Text large color={props.theme.textLightDimmed}>
            {t("emptyWorkbench.emptyArea")}
          </Text>
          <ResponsiveSpacing />
        </Box>
      </Box>
    </Text>
  );
}
EmptyWorkbench.propTypes = {
  t: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
};

const SidePanelButton = React.forwardRef((props, ref) => {
  const { btnText, ...rest } = props;
  return (
    <Button
      primary
      ref={ref}
      renderIcon={props.children && (() => props.children)}
      textProps={{
        large: true
      }}
      {...rest}
    >
      {btnText ? btnText : ""}
    </Button>
  );
});
SidePanelButton.displayName = "SidePanelButton"; // for some reasons lint doesn't like not having this
SidePanelButton.propTypes = {
  btnText: PropTypes.string,
  children: PropTypes.node
};

const StyledSidePanelButton = styled(SidePanelButton)`
  border-radius: 4px;
`;

export const EXPLORE_MAP_DATA_NAME = "ExploreMapDataButton";
export const SIDE_PANEL_UPLOAD_BUTTON_NAME = "SidePanelUploadButton";

const SidePanel = observer(
  createReactClass({
    displayName: "SidePanel",

    propTypes: {
      terria: PropTypes.object.isRequired,
      viewState: PropTypes.object.isRequired,
      refForExploreMapData: PropTypes.object.isRequired,
      refForUploadData: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired,
      theme: PropTypes.object.isRequired
    },

    onAddDataClicked(e) {
      e.stopPropagation();
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openAddData();
    },

    onAddLocalDataClicked(e) {
      e.stopPropagation();
      this.props.viewState.setTopElement("AddData");
      this.props.viewState.openUserData();
    },

    // componentDidUpdate(prevProps, prevState) {
    //   // TODO: This should be done only when a workbench item is deleted.
    //   let needTimeline = false;
    //   this.props.terria.workbench.items.forEach(item => {
    //     if (getTimelineInfo(item) !== null) {
    //       needTimeline = true;
    //     }
    //   });
    //   if (!needTimeline) {
    //     runInAction(() => {
    //       this.props.terria.timelineStack.defaultTimeVarying = undefined;
    //       this.props.terria.timelineStack.items.clear();
    //     });
    //   }
    // },

    render() {
      const { t, theme } = this.props;
      const addData = t("addData.addDataBtnText");
      const uploadText = t("models.catalog.upload");
      return (
        <Box column fullHeight>
          <div
            css={`
              padding: 15px 5px 20px;
            `}
          >
            <FullScreenButton
              terria={this.props.terria}
              viewState={this.props.viewState}
              minified={true}
              animationDuration={250}
              btnText={t("addData.btnHide")}
            />
            {/* <SearchBoxAndResults
              viewState={this.props.viewState}
              terria={this.props.terria}
              placeholder={t("search.placeholder")}
            />
            <Spacing bottom={2} /> */}
            <Box justifyContentSpaceAround>
              <StyledSidePanelButton
                ref={this.props.refForExploreMapData}
                onClick={e => this.onAddDataClicked(e)}
                title={addData}
                btnText={addData}
                styledWidth={"290px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.add}
                  light
                  styledWidth={"20px"}
                />
              </StyledSidePanelButton>
              {/* <SidePanelButton
                ref={this.props.refForUploadData}
                onClick={e => this.onAddLocalDataClicked(e)}
                title={t("addData.load")}
                btnText={uploadText}
                styledWidth={"130px"}
              >
                <StyledIcon
                  glyph={Icon.GLYPHS.uploadThin}
                  light
                  styledWidth={"20px"}
                />
              </SidePanelButton> */}
            </Box>
          </div>
          <Box
            flex={1}
            column
            css={`
              overflow: hidden;
              > div {
                overflow: hidden;
                flex: 1;
                display: flex;
                flex-direction: column;
              }
            `}
          >
            <Choose>
              <When
                condition={
                  this.props.terria.workbench.items &&
                  this.props.terria.workbench.items.length > 0
                }
              >
                <Workbench
                  viewState={this.props.viewState}
                  terria={this.props.terria}
                />
              </When>
              <Otherwise>
                <EmptyWorkbench t={t} theme={theme} />
              </Otherwise>
            </Choose>
          </Box>
        </Box>
      );
    }
  })
);

// Used to create two refs for <SidePanel /> to consume, rather than
// using the withTerriaRef() HOC twice, designed for a single ref
const SidePanelWithRefs = props => {
  const refForExploreMapData = useRefForTerria(
    EXPLORE_MAP_DATA_NAME,
    props.viewState
  );
  const refForUploadData = useRefForTerria(
    SIDE_PANEL_UPLOAD_BUTTON_NAME,
    props.viewState
  );
  return (
    <SidePanel
      {...props}
      refForExploreMapData={refForExploreMapData}
      refForUploadData={refForUploadData}
    />
  );
};
SidePanelWithRefs.propTypes = {
  viewState: PropTypes.object.isRequired
};

module.exports = withTranslation()(withTheme(SidePanelWithRefs));
