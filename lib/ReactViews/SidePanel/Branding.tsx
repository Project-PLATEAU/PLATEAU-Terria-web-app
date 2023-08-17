"use strict";
import { observer } from "mobx-react";
import React from "react";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";

const DEFAULT_BRANDING =
  '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>';

export default observer(
  (props: { terria: Terria; viewState: ViewState; version?: string }) => {
    // Set brandingHtmlElements to brandBarElements or default Terria branding as default
    let brandingHtmlElements = props.terria.configParameters
      .brandBarElements ?? [DEFAULT_BRANDING];

    if (props.viewState.useSmallScreenInterface) {
      const brandBarSmallElements =
        props.terria.configParameters.brandBarSmallElements;
      const displayOne = props.terria.configParameters.displayOneBrand;

      // Use brandBarSmallElements if it exists
      if (brandBarSmallElements) brandingHtmlElements = brandBarSmallElements;
      // If no brandBarSmallElements, but displayOne parameter is selected
      // Try to find brand element based on displayOne index - OR find the first item that isn't an empty string (for backward compatability of old terriamap defaults)
      else if (isDefined(displayOne))
        brandingHtmlElements = [
          (brandingHtmlElements[displayOne] ||
            brandingHtmlElements.find(item => item.length > 0)) ??
            DEFAULT_BRANDING
        ];
    }

    const version = props.version ?? "Unknown";
    return (
      <div
        css={`
          display: flex;
          justify-content: space-between;

          box-sizing: border-box;

          // width: 100%;
          width: 200px;
          height: ${(p: any) => p.theme.smLogoHeight};

          overflow: hidden;

          a {
            display: flex;
            -webkit-box-align: center;
            align-items: center;
            -webkit-box-pack: center;
            justify-content: center;
          }
          span {
            display: block;
          }
          img {
            max-height: 100%;
            max-width: 100%;
          }

          font-family: ${(p: any) => p.theme.fontPop};

          padding: 0 0;

          @media (max-width: ${(p: any) => p.theme.sm}px) {
            width: 100%;
            height: ${(p: any) => p.theme.logoSmallHeight};
            padding: 5px 0;

            // Remove a "display: flex" on small screen if only showing one brandingHtmlElement
            a {
              ${brandingHtmlElements.length > 0 ? "display: unset;" : ""}
            }
          }
        `}
      >
        {brandingHtmlElements.map((element, idx) => (
          <React.Fragment key={idx}>
            {parseCustomHtmlToReact(
              element.replace(/\{\{\s*version\s*\}\}/g, version),
              { disableExternalLinkIcon: true }
            )}
          </React.Fragment>
        ))}
      </div>
    );

    // plateau v1.0 でのカスタマイズ
    // return (
    //   <a
    //     css={`
    //       display: flex;
    //       align-items: center;
    //       box-sizing: border-box;
    //       height: ${(p: any) => p.theme.smLogoHeight};
    //       overflow: hidden;
    //       @include transition(all, 0.5s, linear);

    //       @media (min-width: ${(p: any) => p.theme.sm}px) {
    //         // padding: 5px 12px;
    //         margin: 0 -10px;
    //         height: 100%;
    //         padding: 8px 0;
    //       }

    //       img {
    //         max-height: 100%;
    //         max-width: 100%;

    //         // For some reason without this IE9 flips out and stretches the images.
    //         // width: auto;
    //         // height: auto;
    //       }
    //     `}
    //     href="https://www.mlit.go.jp/plateau/"
    //     target="_blank"
    //     rel="noreferrer noreferrer"
    //   >
    //     {brandingHtmlElements.map((element, idx) => (
    //       <React.Fragment key={idx}>
    //         {parseCustomHtmlToReact(
    //           element.replace(/\{\{\s*version\s*\}\}/g, version)
    //         )}
    //       </React.Fragment>
    //     ))}
    //   </a>
    // );
  }
);
