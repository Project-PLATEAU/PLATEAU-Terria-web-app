import i18next from "i18next";
import { configure, runInAction } from "mobx";
import URI from "urijs";
import { JsonObject } from "../../../../lib/Core/Json";
import _loadWithXhr from "../../../../lib/Core/loadWithXhr";
import CatalogGroup from "../../../../lib/Models/Catalog/CatalogGroup";
import CkanCatalogGroup, {
  CkanServerStratum
} from "../../../../lib/Models/Catalog/Ckan/CkanCatalogGroup";
import CkanItemReference from "../../../../lib/Models/Catalog/Ckan/CkanItemReference";
import Terria from "../../../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";

configure({
  enforceActions: "observed",
  computedRequiresReaction: true
});

interface ExtendedLoadWithXhr {
  (): any;
  load: { (...args: any[]): any; calls: any };
}

const loadWithXhr: ExtendedLoadWithXhr = <any>_loadWithXhr;

describe("CkanCatalogGroup", function() {
  const ckanServerUrl = "http://data.gov.au";
  let terria: Terria;
  let ckanCatalogGroup: CkanCatalogGroup;
  let ckanServerStratum: CkanServerStratum;

  beforeEach(async function() {
    terria = new Terria({
      baseUrl: "./"
    });
    ckanCatalogGroup = new CkanCatalogGroup("test", terria);

    const realLoadWithXhr = loadWithXhr.load;
    // We replace calls to real servers with pre-captured JSON files so our testing is isolated, but reflects real data.
    spyOn(loadWithXhr, "load").and.callFake(function(...args: any[]) {
      args[0] = "test/CKAN/search-result.json";

      return realLoadWithXhr(...args);
    });
  });

  it("has a type and typeName", function() {
    expect(ckanCatalogGroup.type).toBe("ckan-group");
    expect(ckanCatalogGroup.typeName).toBe(i18next.t("models.ckan.nameServer"));
  });

  it("add filter query correctly", function() {
    const filterQueries: (JsonObject | string)[] = [
      "fq=+(res_format%3Awms%20OR%20res_format%3AWMS)",
      "fq=(res_format:wms OR res_format:WMS)",
      { fq: "(res_format:wms OR res_format:WMS)" }
    ];
    const expectedQueryStrings = [
      "fq=+%28res_format%3Awms+OR+res_format%3AWMS%29",
      "fq=%28res_format%3Awms+OR+res_format%3AWMS%29",
      "fq=%28res_format%3Awms+OR+res_format%3AWMS%29"
    ];

    filterQueries.forEach((filterQuery, i) => {
      const uri = new URI("https://somewhere.com");
      CkanServerStratum.addFilterQuery(uri, filterQuery);
      expect(uri.query() === expectedQueryStrings[i]).toBeTruthy();
    });

    filterQueries.forEach((filterQuery, i) => {
      const uri = new URI("https://somewhere.com");
      uri.addQuery({ start: 0 });
      CkanServerStratum.addFilterQuery(uri, filterQuery);
      expect(uri.query() === "start=0&" + expectedQueryStrings[i]).toBeTruthy();
    });
  });

  describe("after loading metadata - default settings - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );
    });

    it("properly creates members", function() {
      expect(ckanCatalogGroup.members).toBeDefined();
      expect(ckanCatalogGroup.members.length).toBe(2);
      let member0 = <CatalogGroup>ckanCatalogGroup.memberModels[0];
      let member1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(member0.name).toBe("Department of the Environment and Energy");
      expect(member1.name).toBe("Murray-Darling Basin Authority");
    });

    it("properly creates groups", function() {
      if (ckanServerStratum !== undefined) {
        if (ckanServerStratum.groups) {
          // 3 groups because we add an Ungrouped Group
          expect(ckanServerStratum.groups.length).toBe(3);

          // 3 groups are sorted by name
          let group0 = <CatalogGroup>ckanServerStratum.groups[0];
          expect(group0.name).toBe("Department of the Environment and Energy");
          // There is only 1 resource on the 1 dataset
          expect(group0.members.length).toBe(1);

          let group1 = <CatalogGroup>ckanServerStratum.groups[1];
          expect(group1.name).toBe("Murray-Darling Basin Authority");
          // There are 2 resources on the 2 datasets
          expect(group1.members.length).toBe(9);

          let group2 = <CatalogGroup>ckanServerStratum.groups[2];
          expect(group2.name).toBe(ckanCatalogGroup.ungroupedTitle);
          expect(group2.name).toBe("No group");
          expect(group2.members.length).toBe(0);
        }
      }
    });
  });

  describe("after loading metadata - change some settings - ", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
        ckanCatalogGroup.setTrait("definition", "groupBy", "group");
        ckanCatalogGroup.setTrait("definition", "ungroupedTitle", "Blah");
        ckanCatalogGroup.setTrait("definition", "excludeMembers", [
          "Geography"
        ]);
        ckanCatalogGroup.setTrait("definition", "itemProperties", {
          layers: "abc"
        });
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );
    });

    it("properly creates members", function() {
      expect(ckanCatalogGroup.members).toBeDefined();
      expect(ckanCatalogGroup.members.length).toBe(3);
      let member0 = <CatalogGroup>ckanCatalogGroup.memberModels[0];
      expect(member0 instanceof CatalogGroup).toBeTruthy();
      expect(member0.name).toBe("Blah");
      let member1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(member1 instanceof CatalogGroup).toBeTruthy();
      expect(member1.name).toBe("Environment");
      let member2 = <CatalogGroup>ckanCatalogGroup.memberModels[2];
      expect(member2 instanceof CatalogGroup).toBeTruthy();
      expect(member2.name).toBe("Science");
    });

    it("Geography group has been filtered from the groups", function() {
      if (ckanServerStratum.groups && ckanServerStratum.filteredGroups) {
        expect(ckanServerStratum.groups.length).toBe(4);
        expect(ckanServerStratum.filteredGroups.length).toBe(3);
      }
    });

    it("itemProperties get added", async function() {
      const m = terria.getModelById(
        CkanItemReference,
        ckanCatalogGroup.uniqueId +
          "/66e3efa7-fb5c-4bd7-9478-74adb6277955/1dae2cfe-345b-4320-bf0c-4da0de061dc5"
      );
      expect(m).toBeDefined();
      if (m) {
        await m.loadReference();
        const target = m.target as WebMapServiceCatalogItem;
        expect(target).toBeDefined();
        if (target) {
          expect(target.layers).toBe("abc");
        }
      }
    });
  });
  describe("with item naming using", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
      });
    });

    it("useDatasetNameAndFormatWhereMultipleResources (the default)", async function() {
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(group1.memberModels.length).toBe(9);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );
      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );

      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - SHP"
      );
    });

    it("useCombinationNameWhereMultipleResources", async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "useCombinationNameWhereMultipleResources",
          true
        );
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];
      expect(group1.memberModels.length).toBe(9);

      // These items include their Dataset name in their Resource name, so it's not the greatest demonstration
      //  of useCombinationNameWhereMultipleResources, but it works for an automated test
      const items = group1.memberModels as CkanItemReference[];

      // Note item 0 and item 1 will NOT have combination name - as multiple resources for the same format will have `useResourceName = true`
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );

      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );

      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - Murray-Darling Basin Water Resource Plan Areas – Surface Water for ESRI ArcGIS"
      );
      expect(items[3].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - Murray-Darling Basin Water Resource Plan Areas – Surface Water - Preview this Dataset (WMS)"
      );
    });

    it("useResourceName", async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait("definition", "useResourceName", true);
      });
      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(9);

      const items = group1.memberModels as CkanItemReference[];

      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water for ESRI ArcGIS"
      );
      expect(items[3].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - Preview this Dataset (WMS)"
      );
    });
  });

  describe("filters resources according to supportedResourceFormats", function() {
    beforeEach(async function() {
      runInAction(() => {
        ckanCatalogGroup.setTrait(
          "definition",
          "url",
          "test/CKAN/search-result.json"
        );
      });
    });

    it("urlRegex", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        supportedResourceFormats: [
          {
            id: "WMS",
            urlRegex: "^((?!data.gov.au/geoserver).)*$"
          }
        ]
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(7);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );
      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );
      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - SHP"
      );
      expect(items[3].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - KMZ"
      );
    });

    it("onlyUseIfSoleResource - with multiple resources", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        supportedResourceFormats: [
          {
            id: "Kml",
            onlyUseIfSoleResource: true
          }
        ]
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(7);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );
      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );
      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - SHP"
      );
      expect(items[3].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - WMS"
      );
    });

    it("onlyUseIfSoleResource - with single resources", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        supportedResourceFormats: [
          {
            id: "Kml",
            onlyUseIfSoleResource: true
          },
          {
            id: "GeoJson",
            formatRegex: "somethingIncorrect"
          },
          {
            id: "WMS",
            formatRegex: "somethingIncorrect"
          },
          {
            id: "Shapefile",
            formatRegex: "somethingIncorrect"
          }
        ]
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group0 = <CatalogGroup>ckanCatalogGroup.memberModels[0];

      expect(group0.memberModels.length).toBe(2);

      const items = group0.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water"
      );
      expect(items[0]._supportedFormat?.id).toBe("Kml");

      expect(items[1].name).toBe("Groundwater SDL Resource Units");
      expect(items[1]._supportedFormat?.id).toBe("Kml");
    });

    it("maxFileSize", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        supportedResourceFormats: [
          {
            id: "Kml",
            maxFileSize: 3
          }
        ]
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(8);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );
      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );
      expect(items[2].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water - SHP"
      );
    });

    it("removeDuplicates", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        supportedResourceFormats: [
          {
            id: "GeoJson",
            removeDuplicates: false
          }
        ]
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(9);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON"
      );
      expect(items[1].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water GeoJSON (another one)"
      );
      expect(items[0]._ckanResource?.id).toBe(
        "49e8da1c-1ce6-4008-bdcb-af8552a305c2"
      );
      expect(items[1]._ckanResource?.id).toBe(
        "49e8da1c-1ce6-4008-bdcb-af8552a305c2-2"
      );
    });

    it("useSingleResource", async function() {
      updateModelFromJson(ckanCatalogGroup, CommonStrata.definition, {
        useSingleResource: true
      });

      await ckanCatalogGroup.loadMembers();
      ckanServerStratum = <CkanServerStratum>(
        ckanCatalogGroup.strata.get(CkanServerStratum.stratumName)
      );

      let group1 = <CatalogGroup>ckanCatalogGroup.memberModels[1];

      expect(group1.memberModels.length).toBe(2);

      const items = group1.memberModels as CkanItemReference[];
      expect(items[0].name).toBe(
        "Murray-Darling Basin Water Resource Plan Areas – Surface Water"
      );
      expect(items[0]._ckanResource?.id).toBe(
        "49e8da1c-1ce6-4008-bdcb-af8552a305c2"
      );
      expect(items[0]._ckanResource?.format).toBe("GeoJSON");

      expect(items[1].name).toBe("Groundwater SDL Resource Units");
      expect(items[1]._ckanResource?.id).toBe(
        "4e221b55-1702-4f3a-8066-c7dd13bc4cd7"
      );
      expect(items[1]._ckanResource?.format).toBe("GeoJSON");
    });
  });
});
