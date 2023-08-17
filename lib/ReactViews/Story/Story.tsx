import React, { MouseEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { sortable } from "react-anything-sortable";
import classNames from "classnames";
import { TFunction } from "i18next";

import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Ul from "../../Styled/List";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import Icon, { StyledIcon } from "../../Styled/Icon";

export interface Story {
  title: string;
  text: string;
  id: string;
  shareData?: any;
}

interface Props {
  story: Story;
  editStory: () => void;
  viewStory: () => void;
  deleteStory: () => void;
  recaptureStory: () => void;
  recaptureStorySuccessful: boolean;
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  parentRef: any;

  //props for react-anything-sortable
  className: any;
  style: any;
  onMouseDown(): void;
  onTouchStart(): void;
}

interface MenuProps extends Props {
  t: TFunction;
}

const findTextContent = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }
  if (content[0] && content[0].props && content[0].props.children) {
    return findTextContent(content[0].props.children);
  }
  if (!content.props || !content.props.children) {
    return "";
  }
  if (typeof content.props.children === "string") {
    return content.props.children;
  }
  return findTextContent(content.props.children);
};

const StoryControl = styled(Box).attrs({
  centered: true,
  left: true,
  justifySpaceBetween: true
})``;

const StoryMenuButton = styled(RawButton)`
  color: ${props => props.theme.textDarker};
  background-color: ${props => props.theme.textLight};

  ${StyledIcon} {
    width: 35px;
  }

  svg {
    fill: ${props => props.theme.textDarker};
    width: 18px;
    height: 18px;
  }

  border-radius: 0;

  width: 114px;
  // ensure we support long strings
  min-height: 32px;
  display: block;

  &:hover,
  &:focus {
    color: ${props => props.theme.textLight};
    background-color: ${props => props.theme.colorPrimary};

    svg {
      fill: ${props => props.theme.textLight};
      stroke: ${props => props.theme.textLight};
    }
  }
`;

const hideList = (props: Props) => props.closeMenu();

const getTruncatedContent = (text: string) => {
  const content = parseCustomHtmlToReact(text);
  const except = findTextContent(content);
  return except.slice(0, 100);
};

const toggleMenu = (props: Props): MouseEventHandler<HTMLElement> => event => {
  event.stopPropagation();
  props.openMenu();
};

const viewStory = (props: Props): MouseEventHandler<HTMLElement> => event => {
  event.stopPropagation();
  props.viewStory();
  hideList(props);
};

const deleteStory = (props: Props): MouseEventHandler<HTMLElement> => event => {
  event.stopPropagation();
  props.deleteStory();
  hideList(props);
};

const editStory = (props: Props): MouseEventHandler<HTMLElement> => event => {
  event.stopPropagation();
  props.editStory();
  hideList(props);
};

const recaptureStory = (
  props: Props
): MouseEventHandler<HTMLElement> => event => {
  event.stopPropagation();
  props.recaptureStory();
  hideList(props);
};

const calculateOffset = (props: Props) => (
  storyRef: React.RefObject<HTMLElement>
) => {
  const offsetTop = storyRef.current?.offsetTop || 0;
  const scrollTop = props.parentRef.current.scrollTop || 0;
  const heightParent =
    (storyRef.current?.offsetParent as HTMLElement)?.offsetHeight || 0;

  const offsetTopScroll = offsetTop - scrollTop + 25;
  if (offsetTopScroll + 125 > heightParent) {
    return `bottom ${offsetTopScroll + 125 - heightParent + 45}px;`;
  }
  return `top: ${offsetTopScroll}px;`;
};

const renderMenu = (props: MenuProps) => {
  const { t } = props;

  return (
    <Ul>
      <li>
        <StoryMenuButton
          onClick={viewStory(props)}
          title={t("story.viewStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.viewStory} />
            <span>{t("story.view")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={editStory(props)}
          title={t("story.editStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.editStory} />
            <span>{t("story.edit")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={recaptureStory(props)}
          title={t("story.recaptureStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.story} />
            <span>{t("story.recapture")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
      <li>
        <StoryMenuButton
          onClick={deleteStory(props)}
          title={t("story.deleteStory")}
        >
          <StoryControl>
            <StyledIcon glyph={Icon.GLYPHS.cancel} />
            <span>{t("story.delete")}</span>
          </StoryControl>
        </StoryMenuButton>
      </li>
    </Ul>
  );
};

const Story = (props: Props) => {
  const story = props.story;
  const bodyText = getTruncatedContent(story.text);
  const theme = useTheme();
  const { t } = useTranslation();
  const storyRef = useRef<HTMLDivElement>(null);
  const closeHandler = () => {
    hideList(props);
  };

  useEffect(() => {
    window.addEventListener("click", closeHandler);
    return () => window.removeEventListener("click", closeHandler);
  });

  return (
    <>
      <Box
        ref={storyRef}
        column
        backgroundColor={theme.darkWithOverlay}
        rounded
        css={`
          cursor: move;
          float: none !important;
        `}
        position="static"
        style={props.style}
        className={classNames(props.className)}
        onMouseDown={props.onMouseDown}
        onTouchStart={props.onTouchStart}
      >
        <Box
          fullWidth
          position="static"
          justifySpaceBetween
          padded
          verticalCenter
          styledHeight={"40px"}
          backgroundColor={theme.darkWithOverlay}
          rounded
          css={`
            padding-left: 15px;
            padding-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          `}
        >
          <Text textLight medium>
            {story.title && story.title.length > 0
              ? story.title
              : t("story.untitledScene")}
          </Text>
          <Box>
            {props.recaptureStorySuccessful && (
              <RawButton>
                <StyledIcon
                  styledWidth="20px"
                  light
                  glyph={Icon.GLYPHS.recapture}
                  css={`
                    padding-right: 10px;
                  `}
                />
              </RawButton>
            )}
            <MenuButton theme={theme} onClick={toggleMenu(props)}>
              <StyledIcon
                styledWidth="20px"
                light
                glyph={Icon.GLYPHS.menuDotted}
              />
            </MenuButton>
          </Box>
          {props.menuOpen && (
            <Box
              css={`
                position: absolute;
                z-index: 100;
                right: 20px;

                ${calculateOffset(props)(storyRef)}
                padding: 0;
                margin: 0;

                ul {
                  list-style: none;
                }
              `}
            >
              {renderMenu({ ...props, t })}
            </Box>
          )}
        </Box>
        {bodyText.length > 0 && (
          <Box paddedRatio={2} paddedHorizontally={3}>
            <Text textLight medium>
              {bodyText}
            </Text>
          </Box>
        )}
      </Box>
      <Spacing bottom={1} />
    </>
  );
};

const MenuButton = styled(RawButton)`
  padding: 0 10px 0 10px;
  min-height: 40px;
  border-radius: ${props => props.theme.radiusLarge};
  background: transparent;

  &:hover,
  &:focus {
    opacity: 0.9;
    background-color: ${props => props.theme.dark};
  }
`;

export default sortable(Story);
