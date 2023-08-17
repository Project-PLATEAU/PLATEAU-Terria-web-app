import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "../mixTraits";
import UrlTraits from "./UrlTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";

export default class WebProcessingServiceCatalogGroupTraits extends mixTraits(
  UrlTraits,
  GroupTraits,
  GetCapabilitiesTraits,
  CatalogMemberTraits,
  LegendOwnerTraits
) {
  @anyTrait({
    name: "Item Properties",
    description: "Properties to be set for each member of this WPS group"
  })
  itemProperties?: JsonObject;
}
