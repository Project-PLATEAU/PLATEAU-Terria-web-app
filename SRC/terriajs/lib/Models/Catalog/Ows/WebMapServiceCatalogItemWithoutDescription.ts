import WebMapServicdeCatalogItem from "./WebMapServiceCatalogItem";

import { computed } from "mobx";

export default class WebMapServiceCatalogItemWithoutDescription extends WebMapServicdeCatalogItem {
  @computed
  get info() {
    return [];
  }
  @computed
  get infoWithoutSources() {
    return [];
  }
}
