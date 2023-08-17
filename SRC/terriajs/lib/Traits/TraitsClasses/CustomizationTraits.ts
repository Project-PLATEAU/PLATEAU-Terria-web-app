import ModelTraits from "../ModelTraits";
import anyTrait from "../Decorators/anyTrait";
import { JsonObject } from "../../Core/Json";

export default class CustomizationTraits extends ModelTraits {
  @anyTrait({
    name: "Custom Properties",
    description: "The dictionary of custom item properties."
  })
  customProperties?: JsonObject;
}
