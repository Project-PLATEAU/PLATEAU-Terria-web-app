import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import LayerOrderingTraits from "./LayerOrderingTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import MappableTraits from "./MappableTraits";
import RasterLayerTraits from "./RasterLayerTraits";
import UrlTraits from "./UrlTraits";

export default class OpenStreetMapCatalogItemTraits extends mixTraits(
  RasterLayerTraits,
  LayerOrderingTraits,
  UrlTraits,
  MappableTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @primitiveTrait({
    name: "File extension",
    description: "The file extension used to retrieve Open Street Map data",
    type: "string"
  })
  fileExtension = "png";

  @primitiveArrayTrait({
    name: "Subdomains",
    description:
      "Array of subdomains, one of which will be prepended to each tile URL. This is useful for overcoming browser limit on the number of simultaneous requests per host.",
    type: "string"
  })
  subdomains: string[] = [];

  @primitiveTrait({
    name: "Maximum Level",
    description: "The maximum level of details to fetch",
    type: "number"
  })
  maximumLevel = 25;
}
