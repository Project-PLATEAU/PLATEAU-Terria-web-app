import { VectorTileFeature } from "@mapbox/vector-tile";
import bbox from "@turf/bbox";
import i18next from "i18next";
import { clone } from "lodash-es";
import { action, computed, observable, runInAction } from "mobx";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import {
  json_style,
  LabelRule,
  LineSymbolizer,
  PolygonSymbolizer,
  Rule as PaintRule
} from "terriajs-protomaps";
import isDefined from "../../../Core/isDefined";
import { JsonObject } from "../../../Core/Json";
import loadJson from "../../../Core/loadJson";
import TerriaError from "../../../Core/TerriaError";
import ProtomapsImageryProvider, {
  GeojsonSource
} from "../../../Map/ProtomapsImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import MapboxVectorTileCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxVectorTileCatalogItemTraits";
import { RectangleTraits } from "../../../Traits/TraitsClasses/MappableTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

class MapboxVectorTileLoadableStratum extends LoadableStratum(
  MapboxVectorTileCatalogItemTraits
) {
  static stratumName = "MapboxVectorTileLoadable";

  constructor(
    readonly item: MapboxVectorTileCatalogItem,
    readonly styleJson: JsonObject | undefined
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MapboxVectorTileLoadableStratum(
      newModel as MapboxVectorTileCatalogItem,
      this.styleJson
    ) as this;
  }

  static async load(item: MapboxVectorTileCatalogItem) {
    let styleJson: JsonObject | undefined;
    if (item.styleUrl) {
      try {
        styleJson = await loadJson(proxyCatalogItemUrl(item, item.styleUrl));
      } catch (e) {
        throw TerriaError.from(
          e,
          `Failed to load style JSON from url ${item.styleUrl}`
        );
      }
    }
    return new MapboxVectorTileLoadableStratum(item, styleJson);
  }

  get style() {
    return this.styleJson;
  }

  get opacity() {
    return 1;
  }

  @computed get legends() {
    if (!this.item.fillColor && !this.item.lineColor) return [];
    return [
      createStratumInstance(LegendTraits, {
        items: [
          createStratumInstance(LegendItemTraits, {
            color: this.item.fillColor,
            outlineColor: this.item.lineColor,
            title: this.item.name
          })
        ]
      })
    ];
  }

  @computed
  get rectangle() {
    if (
      this.item.imageryProvider?.source instanceof GeojsonSource &&
      this.item.imageryProvider.source.geojsonObject
    ) {
      const geojsonBbox = bbox(this.item.imageryProvider.source.geojsonObject);
      return createStratumInstance(RectangleTraits, {
        west: geojsonBbox[0],
        south: geojsonBbox[1],
        east: geojsonBbox[2],
        north: geojsonBbox[3]
      });
    }
  }
}

StratumOrder.addLoadStratum(MapboxVectorTileLoadableStratum.stratumName);

class MapboxVectorTileCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(MapboxVectorTileCatalogItemTraits)))
) {
  @observable
  public readonly forceProxy = true;

  static readonly type = "mvt";

  get type() {
    return MapboxVectorTileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.mapboxVectorTile.name");
  }

  async forceLoadMetadata() {
    const stratum = await MapboxVectorTileLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(MapboxVectorTileLoadableStratum.stratumName, stratum);
    });
  }

  @computed
  get parsedJsonStyle() {
    if (this.style) {
      return json_style(this.style, new Map());
    }
  }

  @computed
  /** Convert traits into paint rules:
   * - `layer` and `fillColor`/`lineColor` into simple rules
   * - `parsedJsonStyle`
   */
  get paintRules(): PaintRule[] {
    let rules: PaintRule[] = [];

    if (this.layer) {
      if (this.fillColor) {
        rules.push({
          dataLayer: this.layer,
          symbolizer: new PolygonSymbolizer({ fill: this.fillColor }),
          minzoom: this.minimumZoom,
          maxzoom: this.maximumZoom
        });
      }
      if (this.lineColor) {
        rules.push({
          dataLayer: this.layer,
          symbolizer: new LineSymbolizer({ color: this.lineColor }),
          minzoom: this.minimumZoom,
          maxzoom: this.maximumZoom
        });
      }
    }

    if (this.parsedJsonStyle) {
      rules.push(
        ...((<unknown>this.parsedJsonStyle.paint_rules) as PaintRule[])
      );
    }

    return rules;
  }

  @computed
  get labelRules(): LabelRule[] {
    if (this.parsedJsonStyle) {
      return (<unknown>this.parsedJsonStyle.label_rules) as LabelRule[];
    }
    return [];
  }

  @computed
  get imageryProvider(): ProtomapsImageryProvider | undefined {
    if (this.url === undefined) {
      return;
    }

    return new ProtomapsImageryProvider({
      terria: this.terria,
      data: this.url,
      minimumZoom: this.minimumZoom,
      maximumNativeZoom: this.maximumNativeZoom,
      maximumZoom: this.maximumZoom,
      credit: this.attribution,
      paintRules: this.paintRules,
      labelRules: this.labelRules
      // featureInfoFunc: this.featureInfoFromFeature,
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    if (this.isLoadingMapItems || this.imageryProvider === undefined) {
      return [];
    }

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }

  @action.bound
  featureInfoFromFeature(feature: VectorTileFeature) {
    const featureInfo = new ImageryLayerFeatureInfo();
    if (isDefined(this.nameProperty)) {
      featureInfo.name = feature.properties[this.nameProperty];
    }
    (featureInfo as any).properties = clone(feature.properties);
    featureInfo.data = {
      id: feature.properties[this.idProperty]
    }; // For highlight
    return featureInfo;
  }
}

export default MapboxVectorTileCatalogItem;
