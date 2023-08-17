import { computed } from "mobx";
import Cesium from "../../lib/Models/Cesium";
import Terria from "../../lib/Models/Terria";
import TerriaViewer from "../../lib/ViewModels/TerriaViewer";

describe("BoxDrawing", function() {
  let terria: Terria;
  let cesium: Cesium;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    const terriaViewer = new TerriaViewer(
      terria,
      computed(() => [])
    );
    const container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);

    cesium = new Cesium(terriaViewer, container);
  });

  describe("the dataSource", function() {
    it("has 6 sides", function() {
      // const box = new BoxDrawing(cesium, Matrix4.IDENTITY, () => {});
      // const sides = box.dataSource.entities.values.filter(isSideEntity);
      // expect(sides.length).toEqual(6);
    });

    it("has 14 scaling points");
    it("has 4 rotation edges");
  });

  describe("setTransform", function() {
    it("updates the box position, orientation and dimensions");
  });

  describe("interaction", function() {
    it("stops interactions when show is set to false on the datasource");
    it("starts interactions when show is set to true on the datasource");
    it("stops interactions when datasource becomes unobserved");
    it("starts interactions when datasource becomes observed");
  });

  describe("move interaction", function() {
    it("can move the box up and down by dragging the top side");
    it("can move the box sideways by dragging any other side");
    it(
      "when clamping is enabled, move should not allow the box to go below the ground"
    );
  });

  describe("scale interaction", function() {
    it("can scale the box along a side axis by dragging a face point");
    it("can scale the box proportionately by dragging a corner point");
    it(
      "when clamping is enabled, scaling should not make the box go underground"
    );
  });

  describe("rotate interaction", function() {
    it("can rotate the box by dragging an edge");
  });
});
