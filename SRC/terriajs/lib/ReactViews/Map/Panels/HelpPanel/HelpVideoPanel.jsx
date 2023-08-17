import classNames from "classnames";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Icon from "../../../../Styled/Icon";
import Styles from "./help-panel.scss";
import Spacing from "../../../../Styled/Spacing";
import Box from "../../../../Styled/Box";
import VideoGuide from "./VideoGuide";
import TrainerPane from "./TrainerPane";
import StyledHtml from "./StyledHtml";
import SatelliteGuide from "../../../Guide/SatelliteGuide";

const HELP_VIDEO_NAME = "helpVideo";

@observer
class HelpVideoPanel extends React.Component {
  static displayName = "HelpVideoPanel";

  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    itemString: PropTypes.string,
    paneMode: PropTypes.string,
    markdownContent: PropTypes.string,
    videoUrl: PropTypes.string,
    placeholderImage: PropTypes.string,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    const helpItemType = this.props.paneMode || "videoAndContent"; // default is video panel
    const itemSelected =
      this.props.viewState.selectedHelpMenuItem === this.props.itemString;
    const isExpanded = this.props.viewState.selectedHelpMenuItem !== "";
    const className = classNames({
      [Styles.videoPanel]: true,
      [Styles.isVisible]: isExpanded,
      // when the help entire video panel is invisible (hidden away to the right)
      [Styles.shiftedToRight]:
        !isExpanded ||
        !this.props.viewState.showHelpMenu ||
        this.props.viewState.topElement !== "HelpPanel",
      [Styles.isHidden]: !itemSelected // when the item isn't selected
    });
    return (
      <div className={className}>
        <VideoGuide
          viewState={this.props.viewState}
          videoLink={this.props.videoUrl}
          background={this.props.placeholderImage}
          videoName={HELP_VIDEO_NAME}
        />
        <Box
          centered
          fullWidth
          fullHeight
          displayInlineBlock
          paddedHorizontally={4}
          paddedVertically={18}
          css={`
            overflow: auto;
            overflow-x: hidden;
            overflow-y: auto;
          `}
          scroll
        >
          <If condition={helpItemType === "videoAndContent"}>
            {this.props.videoUrl && this.props.placeholderImage && (
              <div key={"image"}>
                <div
                  className={Styles.videoLink}
                  style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)), url(${this.props.placeholderImage})`
                  }}
                >
                  <button
                    className={Styles.videoBtn}
                    onClick={() =>
                      this.props.viewState.setVideoGuideVisible(HELP_VIDEO_NAME)
                    }
                  >
                    <Icon glyph={Icon.GLYPHS.play} />
                  </button>
                </div>
                <Spacing bottom={5} />
              </div>
            )}
            {this.props.markdownContent && (
              <StyledHtml
                key={"markdownContent"}
                viewState={this.props.viewState}
                markdown={this.props.markdownContent}
              />
            )}
          </If>
          <If condition={helpItemType === "slider"}>
            <SatelliteGuide
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </If>
          <If condition={helpItemType === "trainer"}>
            <TrainerPane
              content={this.props.content}
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </If>
        </Box>
      </div>
    );
  }
}

export default withTranslation()(withTheme(HelpVideoPanel));
