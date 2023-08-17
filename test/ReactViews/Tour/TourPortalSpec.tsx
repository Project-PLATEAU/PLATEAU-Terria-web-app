const create: any = require("react-test-renderer").create;
import React from "react";
import { act } from "react-dom/test-utils";
import { runInAction } from "mobx";
import { withThemeContext } from "../withThemeContext";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CloseButton from "../../../lib/ReactViews/Generic/CloseButton";
import TourPortal, {
  TourPreface,
  TourExplanation
} from "../../../lib/ReactViews/Tour/TourPortal";

describe("TourPortal", function() {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
  });

  describe("with basic props", function() {
    describe("renders", function() {
      it("nothing when current tour index is negative", function() {
        act(() => {
          testRenderer = create(<TourPortal viewState={viewState} />);
        });
        // tourportal should just not render anything in this case
        expect(() => testRenderer.root.findByType("div")).toThrow();
      });
      it("renders something using the TourPreface path under preface conditions", function() {
        runInAction(() => {
          viewState.setTourIndex(0);
          viewState.setShowTour(false);
        });
        act(() => {
          testRenderer = create(
            withThemeContext(<TourPortal viewState={viewState} />)
          );
        });

        // tourportal should render the TourPreface 2*close & accept buttons
        const buttons = testRenderer.root.findAllByType("button");
        expect(testRenderer.root.children).toBeDefined();
        expect(buttons).toBeDefined();
        expect(buttons.length).toEqual(3);
        const closeButton = testRenderer.root.findAllByType(CloseButton);
        expect(closeButton).toBeDefined();
        expect(closeButton.length).toEqual(1);
        expect(testRenderer.root.findByType(TourPreface)).toBeDefined();
        expect(() => testRenderer.root.findByType(TourExplanation)).toThrow();
      });
      it("renders something using the TourGrouping path under showPortal conditions", function() {
        const testRef: any = React.createRef();
        const testRef2: any = React.createRef();
        const testRef3: any = React.createRef();
        act(() => {
          testRenderer = create(
            <div>
              <div ref={testRef} />
              <div ref={testRef2} />
              <div ref={testRef3} />
              {withThemeContext(<TourPortal viewState={viewState} />)}
            </div>,
            {
              createNodeMock: (/* element: any */) => {
                return {
                  // This is not compulsory as we still render if we
                  // can't get a rectangle, but we'll mock it anyway
                  getBoundingClientRect: () => ({
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                  })
                };
                // return document.createElement("div");
              }
            }
          );
        });
        runInAction(() => {
          viewState.setTourIndex(0);
          viewState.setShowTour(true);
          viewState.updateAppRef("TestRef", testRef);
          viewState.updateAppRef("TestRef2", testRef2);
          viewState.updateAppRef("TestRef3", testRef3);
          viewState.tourPoints = [
            {
              appRefName: "TestRef",
              priority: 10,
              content: "## Best friends\n\nMochi and neko are best friends"
            },
            {
              appRefName: "TestRef2",
              priority: 20,
              content: "## Motivated by food\n\nNeko loves food"
            },
            {
              appRefName: "TestRef3",
              priority: 30,
              content: "## Lazy\n\nThey like to lounge around all day"
            }
          ];
        });
        act(() => {
          testRenderer.update(
            withThemeContext(<TourPortal viewState={viewState} />)
          );
        });

        // 3 test tour points
        expect(testRenderer.root.findAllByType(TourExplanation).length).toBe(3);

        // Remove one tour point and we should only have 2 left
        // (e.g. if you add a tour point on the compass,
        // this is triggered when compass disappears between 2D<->3D modes)
        runInAction(() => {
          viewState.deleteAppRef("TestRef");
        });
        act(() => {
          testRenderer.update(
            withThemeContext(<TourPortal viewState={viewState} />)
          );
        });
        // 2 test tour points
        expect(testRenderer.root.findAllByType(TourExplanation).length).toBe(2);
      });
    });
  });
});
