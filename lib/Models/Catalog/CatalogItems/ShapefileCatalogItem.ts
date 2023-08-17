import * as geoJsonMerge from "@mapbox/geojson-merge";
import i18next from "i18next";
import { computed } from "mobx";
import * as shp from "shpjs";
import isDefined from "../../../Core/isDefined";
import JsonValue, { isJsonObject, JsonArray } from "../../../Core/Json";
import loadBlob, { isZip } from "../../../Core/loadBlob";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import ShapefileCatalogItemTraits from "../../../Traits/TraitsClasses/ShapefileCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { fileApiNotSupportedError } from "./GeoJsonCatalogItem";

export function isJsonArrayOrDeepArrayOfObjects(
  value: JsonValue | undefined
): value is JsonArray {
  return (
    Array.isArray(value) &&
    value.every(
      child => isJsonObject(child) || isJsonArrayOrDeepArrayOfObjects(child)
    )
  );
}

class ShapefileCatalogItem extends GeoJsonMixin(
  CatalogMemberMixin(CreateModel(ShapefileCatalogItemTraits))
) {
  static readonly type = "shp";
  get type() {
    return ShapefileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.shapefile.name");
  }

  protected _file?: File;

  setFileInput(file: File) {
    this._file = file;
  }

  @computed get hasLocalData(): boolean {
    return isDefined(this._file);
  }

  protected async forceLoadGeojsonData() {
    // ShapefileCatalogItem._file
    if (this._file) {
      return await parseShapefile(this._file);
    }
    // GeojsonTraits.url
    else if (this.url) {
      // URL to zipped fle
      if (isZip(this.url)) {
        if (typeof FileReader === "undefined") {
          throw fileApiNotSupportedError(this.terria);
        }
        const blob = await loadBlob(this.url);
        return await parseShapefile(blob);
      } else {
        throw TerriaError.from(
          "Invalid URL: Only zipped shapefiles are supported (the extension must be `.zip`)"
        );
      }
    }

    throw TerriaError.from(
      "Failed to load shapefile - no URL of file has been defined"
    );
  }
}

async function parseShapefile(blob: Blob): Promise<FeatureCollectionWithCrs> {
  let json: any;
  const asAb = await blob.arrayBuffer();
  json = await shp.parseZip(asAb);
  if (isJsonArrayOrDeepArrayOfObjects(json)) {
    // There were multiple shapefiles in this zip file. Merge them.
    json = geoJsonMerge.merge(json);
  }
  return json;
}

export default ShapefileCatalogItem;
