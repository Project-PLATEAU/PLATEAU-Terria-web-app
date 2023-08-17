import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import DiscretelyTimeVaryingMixin from "../ModelMixins/DiscretelyTimeVaryingMixin";
import DiscretelyTimeVaryingTraits from "../Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import CommonStrata from "./Definition/CommonStrata";
import CreateModel from "./Definition/CreateModel";
import Terria from "./Terria";

export default class DefaultTimelineModel extends DiscretelyTimeVaryingMixin(
  CreateModel(DiscretelyTimeVaryingTraits)
) {
  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    const now = JulianDate.now();

    const startTime = JulianDate.toDate(now);
    const stopTime = JulianDate.toDate(now);
    for (const tm of [startTime, stopTime]) {
      tm.setHours(0);
      tm.setMinutes(0);
      tm.setSeconds(0);
    }

    stopTime.setDate(stopTime.getDate() + 1);

    this.setTrait(CommonStrata.defaults, "startTime", startTime.toISOString());
    this.setTrait(CommonStrata.defaults, "stopTime", stopTime.toISOString());
  }

  get discreteTimes() {
    return undefined;
  }
}
