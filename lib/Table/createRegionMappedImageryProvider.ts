import { VectorTileFeature } from "@mapbox/vector-tile";
import { action } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import TimeInterval from "terriajs-cesium/Source/Core/TimeInterval";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import isDefined from "../Core/isDefined";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import getChartDetailsFn from "./getChartDetailsFn";
import TableStyle from "./TableStyle";

export default function createRegionMappedImageryProvider(
  style: TableStyle,
  currentTime: JulianDate | undefined
): ImageryProvider | undefined {
  if (!style.isRegions()) {
    return undefined;
  }

  const regionColumn = style.regionColumn;
  const regionType = regionColumn.regionType;
  if (regionType === undefined) {
    return undefined;
  }

  const baseMapContrastColor = style.tableModel.terria.baseMapContrastColor;

  const colorColumn = style.colorColumn;
  const valueFunction =
    colorColumn !== undefined ? colorColumn.valueFunctionForType : () => null;
  const colorMap = style.colorMap;
  const valuesAsRegions = regionColumn.valuesAsRegions;

  let currentTimeRows: number[] | undefined;

  // If time varying, get row indices which match
  if (currentTime && style.timeIntervals && style.moreThanOneTimeInterval) {
    currentTimeRows = style.timeIntervals.reduce<number[]>(
      (rows, timeInterval, index) => {
        if (timeInterval && TimeInterval.contains(timeInterval, currentTime!)) {
          rows.push(index);
        }
        return rows;
      },
      []
    );
  }

  return new MapboxVectorTileImageryProvider({
    url: regionType.server,
    layerName: regionType.layerName,
    styleFunc: function(feature: any) {
      const regionId = feature.properties[regionType.uniqueIdProp];

      let rowNumber = getImageryLayerFilteredRow(
        style,
        currentTimeRows,
        valuesAsRegions.regionIdToRowNumbersMap.get(regionId)
      );
      let value: string | number | null = isDefined(rowNumber)
        ? valueFunction(rowNumber)
        : null;

      const color = colorMap.mapValueToColor(value);
      if (color === undefined) {
        return undefined;
      }

      return {
        fillStyle: color.toCssColorString(),
        strokeStyle: value !== null ? baseMapContrastColor : "transparent",
        lineWidth: 1,
        lineJoin: "miter"
      };
    },
    subdomains: regionType.serverSubdomains,
    rectangle:
      Array.isArray(regionType.bbox) && regionType.bbox.length >= 4
        ? Rectangle.fromDegrees(
            regionType.bbox[0],
            regionType.bbox[1],
            regionType.bbox[2],
            regionType.bbox[3]
          )
        : undefined,
    minimumZoom: regionType.serverMinZoom,
    maximumNativeZoom: regionType.serverMaxNativeZoom,
    maximumZoom: regionType.serverMaxZoom,
    uniqueIdProp: regionType.uniqueIdProp,
    featureInfoFunc: (feature: any) =>
      getImageryLayerFeatureInfo(style, feature, currentTimeRows)
  });
}

/**
 * Filters row numbers by time (if applicable) - for a given region mapped ImageryLayer
 */
const getImageryLayerFilteredRow = action(
  (
    style: TableStyle,
    currentTimeRows: number[] | undefined,
    rowNumbers: number | readonly number[] | undefined
  ): number | undefined => {
    if (!isDefined(rowNumbers)) return;

    if (!isDefined(currentTimeRows)) {
      return Array.isArray(rowNumbers) ? rowNumbers[0] : rowNumbers;
    }

    if (
      typeof rowNumbers === "number" &&
      currentTimeRows.includes(rowNumbers)
    ) {
      return rowNumbers;
    } else if (Array.isArray(rowNumbers)) {
      const matchingTimeRows: number[] = rowNumbers.filter(row =>
        currentTimeRows!.includes(row)
      );
      if (matchingTimeRows.length <= 1) {
        return matchingTimeRows[0];
      }
      // In a time-varying dataset, intervals may
      // overlap at their endpoints (i.e. the end of one interval is the start of the next).
      // In that case, we want the later interval to apply.
      return matchingTimeRows.reduce((latestRow, currentRow) => {
        const currentInterval = style.timeIntervals?.[currentRow]?.stop;
        const latestInterval = style.timeIntervals?.[latestRow]?.stop;
        if (
          currentInterval &&
          latestInterval &&
          JulianDate.lessThan(latestInterval, currentInterval)
        ) {
          return currentRow;
        }
        return latestRow;
      }, matchingTimeRows[0]);
    }
  }
);

/**
 * Get ImageryLayerFeatureInfo for a given ImageryLayer input and feature.
 */

const getImageryLayerFeatureInfo = action(
  (
    style: TableStyle,
    feature: VectorTileFeature,
    currentTimeRows: number[] | undefined
  ) => {
    if (isDefined(style.regionColumn?.regionType?.uniqueIdProp)) {
      const regionType = style.regionColumn!.regionType!;
      const regionRows =
        style.regionColumn!.valuesAsRegions.regionIdToRowNumbersMap.get(
          feature.properties[regionType.uniqueIdProp]
        ) ?? [];

      const rowId = getImageryLayerFilteredRow(
        style,
        currentTimeRows,
        regionRows
      );

      if (!isDefined(rowId)) return;

      style.tableModel.tableColumns;

      const rowObject = style.tableModel.tableColumns.reduce<{
        [key: string]: string | number | null;
      }>((obj, column) => {
        obj[column.title] = column.valueFunctionForType(rowId);

        return obj;
      }, {});

      // Preserve values from d and insert feature properties after entries from d
      const featureData = Object.assign(
        {},
        rowObject,
        feature.properties,
        rowObject
      );

      const featureInfo = new ImageryLayerFeatureInfo();
      if (isDefined(regionType.nameProp)) {
        featureInfo.name = featureData[regionType.nameProp] as string;
      }

      featureData.id = feature.properties[regionType.uniqueIdProp];
      featureInfo.properties = featureData;

      featureInfo.configureDescriptionFromProperties(featureData);
      featureInfo.configureNameFromProperties(featureData);

      // If time-series region-mapping - show timeseries chart
      if (
        !isDefined(featureData._terria_getChartDetails) &&
        style.tableModel.discreteTimes &&
        style.tableModel.discreteTimes.length > 1 &&
        Array.isArray(regionRows)
      ) {
        featureInfo.properties._terria_getChartDetails = getChartDetailsFn(
          style,
          regionRows
        );
      }

      return featureInfo;
    }

    return undefined;
  }
);
