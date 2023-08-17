"use strict";

// import * as Cesium from "cesium/Build/Cesium/Cesium";
// import Cesium from "../Models/Cesium";

import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import DirectionalLight from "terriajs-cesium/Source/Scene/DirectionalLight";
import SunLight from "terriajs-cesium/Source/Scene/SunLight";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";

import { runInAction } from "mobx";
import terrainIds from "./terrainIds";
import createGlobalBaseMapOptions from "./createGlobalBaseMapOptions";
import { featureBelongsToCatalogItem } from "../Map/PickedFeatures";
import { LOCATION_MARKER_DATA_SOURCE_NAME } from "../Models/LocationMarkerUtils";
import i18next from "i18next";
import CommonStrata from "../Models/Definition/CommonStrata";
import updateModelFromJson from "../Models/Definition/updateModelFromJson";
import { BaseMapModel } from "../Models/BaseMaps/BaseMapsModel";

function getDistance(a: any, b: any) {
  var w = a.x - b.x;
  var h = a.y - b.y;
  return Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
}

function getAngle(a: any, b: any, center: any) {
  var innerProduct =
    (a.x - center.x) * (b.x - center.x) + (a.y - center.y) * (b.y - center.y);
  var c = innerProduct / (getDistance(a, center) * getDistance(b, center));

  var isClockwise =
    (a.x - center.x) * (b.y - center.y) - (a.y - center.y) * (b.x - center.x) <=
    0;
  return Math.acos(c) * (180 / Math.PI) * (isClockwise ? 1 : -1);
}

export function setLight(terria: any) {
  const viewer = terria.currentViewer;

  const timelineStack = terria.timelineStack;
  const alwaysShowTimeline =
    timelineStack.defaultTimeVarying !== undefined &&
    timelineStack.defaultTimeVarying.startTimeAsJulianDate !== undefined &&
    timelineStack.defaultTimeVarying.stopTimeAsJulianDate !== undefined &&
    timelineStack.defaultTimeVarying.currentTimeAsJulianDate !== undefined;

  if (alwaysShowTimeline) {
    viewer.scene.light = new SunLight();
  } else {
    const directionalLight = new DirectionalLight({
      direction: new Cartesian3(
        0.7650124487710819,
        -0.6418383470612292,
        -0.05291020191779678
      )
    });
    viewer.scene.light = directionalLight;
  }
}

export function switchTerrain(terria: any, prevAssetId: any) {
  const camera = terria.currentViewer.scene.camera;
  const directionRad = Cartographic.fromCartesian(camera.position);
  const lat = directionRad.latitude * (180 / Math.PI);
  const lng = directionRad.longitude * (180 / Math.PI);

  const tidObj = terrainIds.find(t => {
    if (t.minx <= lng && lng <= t.maxx && t.miny <= lat && lat <= t.maxy) {
      return true;
    }
    return false;
  });
  const assetId = tidObj ? tidObj.ion_asset_id : 286503;
  if (assetId == prevAssetId) {
    return assetId;
  }

  const globalBaseMaps = createGlobalBaseMapOptions(
    terria,
    terria.configParameters.bingMapsKey,
    assetId
  );

  const baseMapId = terria.getLocalProperty("basemap") || "";

  terria.baseMapsModel.loadFromJson(CommonStrata.definition, {
    items: globalBaseMaps
  });

  terria.setLocalProperty("basemap", baseMapId);

  // if (terria.updateBaseMaps) {
  //   runInAction(() => {
  //     terria.baseMaps = [];
  //     terria.updateBaseMaps([...globalBaseMaps]);
  //   });
  //   const baseMap = terria.baseMaps[prevBaseMapIds];
  //   if (baseMap) {
  //     runInAction(() => {
  //       terria.mainViewer.baseMap = baseMap.mappable;
  //     });
  //   }

  //   if (baseMap.mappable) {
  //     const baseMapId = baseMap.mappable.uniqueId;
  //     if (baseMapId) {
  //       terria.setLocalProperty("basemap", baseMapId);
  //     }
  //   }
  // }

  return assetId;
}

export function determineCatalogItem(workbench: any, feature: any) {
  // If the feature is a marker return a fake item
  if (feature.entityCollection && feature.entityCollection.owner) {
    const dataSource = feature.entityCollection.owner;
    if (dataSource.name === LOCATION_MARKER_DATA_SOURCE_NAME) {
      return {
        name: i18next.t("featureInfo.locationMarker")
      };
    }
  }

  if (feature._catalogItem && workbench.items.includes(feature._catalogItem)) {
    return feature._catalogItem;
  }

  return workbench.items.find((item: any) =>
    featureBelongsToCatalogItem(feature, item)
  );
}

export function getVrInfoFromCamera(camera: any) {
  const positionRad = Cartographic.fromCartesian(camera.position);
  const lat = positionRad.latitude * (180 / Math.PI);
  const lng = positionRad.longitude * (180 / Math.PI);
  const height = positionRad.height;
  let heading = 360 - camera.heading * (180 / Math.PI);
  if (heading > 180) {
    heading = heading - 360;
  }
  // とりあえず
  heading = heading * -1;
  const pitch = camera.pitch * (180 / Math.PI);

  return { lat, lng, height, heading, pitch };
}
