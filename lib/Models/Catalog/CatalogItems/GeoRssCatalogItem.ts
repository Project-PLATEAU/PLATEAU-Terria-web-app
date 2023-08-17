import i18next from "i18next";
import { computed, runInAction } from "mobx";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import isDefined from "../../../Core/isDefined";
import loadXML from "../../../Core/loadXML";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import {
  geoRss2ToGeoJson,
  geoRssAtomToGeoJson
} from "../../../Map/geoRssConvertor";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import GeoRssCatalogItemTraits from "../../../Traits/TraitsClasses/GeoRssCatalogItemTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";

enum GeoRssFormat {
  RSS = "rss",
  ATOM = "feed"
}

interface Author {
  name?: string;
  email?: string;
  link?: string;
}

interface Feed {
  id?: string;
  title?: string;
  updated?: string;
  author?: Author;
  category?: string[];
  description?: string;
  contributor?: Author | Author[];
  generator?: string;
  link?: string[];
  copyright?: string;
  subtitle?: string;
}

interface ConvertedJson {
  geoJsonData: any;
  metadata: Feed;
}

class GeoRssStratum extends LoadableStratum(GeoRssCatalogItemTraits) {
  static stratumName = "georss";

  constructor(
    private readonly _item: GeoRssCatalogItem,
    private readonly _geoJsonItem: GeoJsonCatalogItem,
    private readonly _feed: Feed
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new GeoRssStratum(
      newModel as GeoRssCatalogItem,
      this._geoJsonItem,
      this._feed
    ) as this;
  }

  get feedData(): Feed {
    return this._feed;
  }

  get geoJsonItem(): GeoJsonCatalogItem {
    return this._geoJsonItem;
  }

  static async load(item: GeoRssCatalogItem) {
    try {
      const geoJsonItem = new GeoJsonCatalogItem(
        createGuid(),
        item.terria,
        item
      );
      geoJsonItem.setTrait(
        CommonStrata.definition,
        "clampToGround",
        item.clampToGround
      );
      geoJsonItem.setTrait(
        CommonStrata.definition,
        "attribution",
        item.attribution
      );

      const json = await loadGeoRss(item);
      if (isDefined(json.geoJsonData)) {
        geoJsonItem.setTrait(
          CommonStrata.definition,
          "geoJsonData",
          json.geoJsonData
        );
      }
      const feed = json.metadata;
      (await geoJsonItem.loadMetadata()).throwIfError();

      return new GeoRssStratum(item, geoJsonItem, feed);
    } catch (e) {
      throw networkRequestError(
        TerriaError.from(e, {
          title: i18next.t("models.georss.errorLoadingTitle"),
          message: i18next.t("models.georss.errorLoadingMessage")
        })
      );
    }
  }

  @computed get name(): string | undefined {
    if (this._feed.title && this._feed.title.length > 0) {
      return replaceUnderscores(this._feed.title);
    }
  }

  @computed get dataCustodian(): string | undefined {
    if (
      this._feed &&
      this._feed.author &&
      this._feed.author.name &&
      this._feed.author.name.length > 0
    ) {
      return this._feed.author.name;
    }
  }

  @computed get info() {
    return [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.subtitle"),
        content: this._feed.subtitle
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.updated"),
        content: this._feed.updated?.toString()
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.category"),
        content: this._feed.category?.join(", ")
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.description"),
        content: this._feed.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.copyrightText"),
        content: this._feed.copyright
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.author"),
        content: this._feed.author?.name
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.link"),
        content:
          typeof this._feed.link === "string"
            ? this._feed.link
            : this._feed.link?.join(", ")
      })
    ];
  }
}

StratumOrder.addLoadStratum(GeoRssStratum.stratumName);

export default class GeoRssCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GeoRssCatalogItemTraits)))
) {
  static readonly type = "georss";
  get type() {
    return GeoRssCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.georss.name");
  }

  protected forceLoadMetadata(): Promise<void> {
    return GeoRssStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(GeoRssStratum.stratumName, stratum);
      });
    });
  }

  protected async forceLoadMapItems() {
    if (isDefined(this.geoJsonItem)) {
      return (await this.geoJsonItem.loadMapItems()).throwIfError();
    }
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  @computed get geoJsonItem(): GeoJsonCatalogItem | undefined {
    const stratum = <GeoRssStratum>this.strata.get(GeoRssStratum.stratumName);
    return isDefined(stratum) ? stratum.geoJsonItem : undefined;
  }

  @computed get feedData(): Feed | undefined {
    const stratum = <GeoRssStratum>this.strata.get(GeoRssStratum.stratumName);
    return isDefined(stratum) ? stratum.feedData : undefined;
  }

  get mapItems() {
    if (isDefined(this.geoJsonItem)) {
      return this.geoJsonItem.mapItems.map(mapItem => {
        mapItem.show = this.show;
        return mapItem;
      });
    }
    return [];
  }
}

function loadGeoRss(item: GeoRssCatalogItem) {
  return new Promise<Document>(resolve => {
    if (isDefined(item.geoRssString)) {
      const parser = new DOMParser();
      resolve(parser.parseFromString(item.geoRssString, "text/xml"));
    } else if (isDefined(item.url)) {
      resolve(loadXML(proxyCatalogItemUrl(item, item.url)));
    } else {
      throw new TerriaError({
        sender: item,
        title: i18next.t("models.georss.unableToLoadItemTitle"),
        message: i18next.t("models.georss.unableToLoadItemMessage")
      });
    }
  }).then(xmlData => {
    const documentElement = xmlData.documentElement;

    if (documentElement.localName.includes(GeoRssFormat.ATOM)) {
      const jsonData: ConvertedJson = {
        geoJsonData: geoRssAtomToGeoJson(xmlData),
        metadata: parseMetadata(documentElement.childNodes, item)
      };
      return jsonData;
    } else if (documentElement.localName === GeoRssFormat.RSS) {
      const element = documentElement.getElementsByTagName("channel")[0];
      const jsonData: ConvertedJson = {
        geoJsonData: geoRss2ToGeoJson(xmlData),
        metadata: parseMetadata(element.childNodes, item)
      };
      return jsonData;
    } else {
      throw new RuntimeError("document is not valid");
    }
  });
}

function parseMetadata(
  xmlElements: NodeListOf<ChildNode>,
  item: GeoRssCatalogItem
) {
  const result: Feed = {};
  result.link = [];
  result.category = [];
  for (let i = 0; i < xmlElements.length; ++i) {
    const child = <Element>xmlElements[i];
    if (
      child.nodeType !== 1 ||
      child.localName === "item" ||
      child.localName === "entry"
    ) {
      continue;
    }
    if (child.localName === "id") {
      result.id = child.textContent || undefined;
    } else if (child.localName === "title") {
      result.title = child.textContent || undefined;
    } else if (child.localName === "subtitle") {
      result.subtitle = child.textContent || undefined;
    } else if (child.localName === "description") {
      result.description = child.textContent || undefined;
    } else if (child.localName === "category") {
      if (child.textContent) {
        result.category.push(child.textContent);
      }
    } else if (child.localName === "link") {
      if (child.textContent) {
        result.link.push(child.textContent);
      } else {
        const href = child.getAttribute("href");
        if (href) {
          result.link.push(href);
        }
      }
    } else if (child.localName === "updated") {
      result.updated = child.textContent || undefined;
    } else if (
      child.localName === "rights" ||
      child.localName === "copyright"
    ) {
      result.copyright = child.textContent || undefined;
    } else if (child.localName === "author") {
      const authorNode = child.childNodes;
      if (authorNode.length === 0) {
        result.author = {
          name: child.textContent || undefined
        };
      } else {
        let name, email, link;
        for (
          let authorIndex = 0;
          authorIndex < authorNode.length;
          ++authorIndex
        ) {
          const authorChild = <Element>authorNode[authorIndex];
          if (authorChild.nodeType === 1) {
            if (authorChild.localName === "name") {
              name = authorChild.textContent || undefined;
            } else if (authorChild.localName === "email") {
              email = authorChild.textContent || undefined;
            }
            if (authorChild.localName === "link") {
              link = authorChild.textContent || undefined;
            }
          }
        }
        result.author = {
          name: name,
          email: email,
          link: link
        };
      }
    }
  }
  if (item.url && (!isDefined(result.title) || result.title === item.url)) {
    result.title = getFilenameFromUri(item.url);
  }
  return result;
}
