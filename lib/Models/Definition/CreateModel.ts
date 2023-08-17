import { action, computed, observable, runInAction, toJS } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import flatten from "../../Core/flatten";
import { getObjectId } from "../../Traits/ArrayNestedStrataMap";
import { ObjectArrayTrait } from "../../Traits/Decorators/objectArrayTrait";
import { ModelId } from "../../Traits/ModelReference";
import ModelTraits from "../../Traits/ModelTraits";
import TraitsConstructor from "../../Traits/TraitsConstructor";
import Terria from "../Terria";
import addModelStrataView from "./addModelStrataView";
import createStratumInstance from "./createStratumInstance";
import { isLoadableStratum } from "./LoadableStratum";
import ModelType, {
  ArrayElementTypes,
  BaseModel,
  ModelConstructor,
  ModelInterface
} from "./Model";
import StratumFromTraits from "./StratumFromTraits";
import StratumOrder from "./StratumOrder";

export default function CreateModel<T extends TraitsConstructor<ModelTraits>>(
  Traits: T
): ModelConstructor<ModelType<InstanceType<T>>> {
  type Traits = InstanceType<T>;
  type StratumTraits = StratumFromTraits<Traits>;

  abstract class Model extends BaseModel implements ModelInterface<Traits> {
    abstract get type(): string;
    static readonly TraitsClass = Traits;
    static readonly traits = Traits.traits;
    readonly traits = Traits.traits;
    readonly TraitsClass: TraitsConstructor<InstanceType<T>> = <any>Traits;
    readonly strata: Map<string, StratumTraits>;

    /**
     * Babel transpiles this & correctly assigns undefined to this property as
     * under `proposal-class-fields` declaring a property without initialising
     * it still declares it, thus treated as
     *
     * `sourceReference = undefined;`
     * >This differs a bit from certain transpiler implementations, which would
     * >just entirely ignore a field declaration which has no initializer.
     *
     * instead of what we had expected with TypeScript's treatment of this class
     * property being:
     * `readonly sourceReference: BaseModel | undefined;`
     *
     * whereas ts-loader strips the type completely along with the implicit
     * undefined assignment getting removed entirely before it hits
     * babel-loader, side-stepping this case.
     *
     * Given we don't actually do anything different to the main constructor
     * call in `BaseModel`, it feels more correct to remove this annotation
     * rather than declare it here + re-assigning it in the `Model` constructor
     */
    // readonly sourceReference: BaseModel | undefined;

    /**
     * Gets the uniqueIds of models that are known to contain this one.
     * This is important because strata sometimes flow from container to
     * containee, so the properties of this model may not be complete
     * if the container isn't loaded yet. It's also important for locating
     * this model in a hierarchical catalog.
     */
    @observable
    readonly knownContainerUniqueIds: string[] = [];

    constructor(
      id: string | undefined,
      terria: Terria,
      sourceReference: BaseModel | undefined,
      strata: Map<string, StratumTraits> | undefined
    ) {
      super(id, terria, sourceReference);
      this.strata = strata || observable.map<string, StratumTraits>();
    }

    dispose() {}

    private getOrCreateStratum(id: string): StratumTraits {
      let result = this.strata.get(id);
      if (!result) {
        const newStratum = createStratumInstance(Traits);
        runInAction(() => {
          this.strata.set(id, newStratum);
        });
        result = newStratum;
      }
      return result;
    }

    duplicateModel(newId: ModelId, sourceReference?: BaseModel): this {
      const newModel = new (<any>this.constructor)(
        newId,
        this.terria,
        sourceReference
      );
      this.strata.forEach((stratum, stratumId) => {
        const newStratum = isLoadableStratum(stratum)
          ? stratum.duplicateLoadableStratum(newModel)
          : createStratumInstance(Traits, toJS(stratum));
        newModel.strata.set(stratumId, newStratum);
      });
      return newModel;
    }

    @computed
    get strataTopToBottom(): ReadonlyMap<string, StratumTraits> {
      return StratumOrder.sortTopToBottom(this.strata);
    }

    @computed
    get strataBottomToTop(): ReadonlyMap<string, StratumTraits> {
      return StratumOrder.sortBottomToTop(this.strata);
    }

    @action
    setTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key,
      value: StratumTraits[Key]
    ): void {
      this.getOrCreateStratum(stratumId)[trait] = value;
    }

    getTrait<Key extends keyof StratumTraits>(
      stratumId: string,
      trait: Key
    ): StratumTraits[Key] {
      return this.getOrCreateStratum(stratumId)[trait];
    }

    addObject<Key extends keyof ArrayElementTypes<Traits>>(
      stratumId: string,
      traitId: Key,
      objectId: string
    ): ModelType<ArrayElementTypes<Traits>[Key]> | undefined {
      const trait = this.traits[traitId as string] as ObjectArrayTrait<
        ArrayElementTypes<Traits>[Key]
      >;
      const nestedTraitsClass = trait.type;
      const newStratum = createStratumInstance(nestedTraitsClass);
      (<any>newStratum)[trait.idProperty] = objectId;

      const stratum: any = this.getOrCreateStratum(stratumId);
      let array = stratum[traitId];
      if (array === undefined) {
        stratum[traitId] = [];
        array = stratum[traitId];
      }

      array.push(newStratum);

      const models: readonly ModelType<ArrayElementTypes<Traits>[Key]>[] = (<
        any
      >this)[traitId];
      return models.find(
        (o: any, i: number) => getObjectId(trait.idProperty, o, i) === objectId
      );
    }

    /** Return full list of knownContainerUniqueIds.
     * This will recursively travese tree of knownContainerUniqueIds models to return full list of dependencies
     */
    @computed
    get completeKnownContainerUniqueIds(): string[] {
      const findContainers = (model: BaseModel): string[] => [
        ...model.knownContainerUniqueIds,
        ...flatten(
          filterOutUndefined(
            model.knownContainerUniqueIds.map(parentId => {
              const parent = this.terria.getModelById(BaseModel, parentId);
              if (parent) {
                return findContainers(parent);
              }
            })
          )
        )
      ];

      return findContainers(this).reverse();
    }
  }

  addModelStrataView(Model, Traits);
  return <any>Model;
}
