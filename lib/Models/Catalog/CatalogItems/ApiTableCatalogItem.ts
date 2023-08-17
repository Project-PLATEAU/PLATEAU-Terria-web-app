import dateFormat from "dateformat";
import { get as _get } from "lodash";
import { computed, observable, runInAction } from "mobx";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import AutoRefreshingMixin from "../../../ModelMixins/AutoRefreshingMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import TableAutomaticStylesStratum from "../../../Table/TableAutomaticStylesStratum";
import ApiRequestTraits from "../../../Traits/TraitsClasses/ApiRequestTraits";
import ApiTableCatalogItemTraits, {
  ApiTableRequestTraits
} from "../../../Traits/TraitsClasses/ApiTableCatalogItemTraits";
import TableStyleTraits from "../../../Traits/TraitsClasses/TableStyleTraits";
import TableTimeStyleTraits from "../../../Traits/TraitsClasses/TableTimeStyleTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import Model, { BaseModel } from "../../Definition/Model";
import saveModelToJson from "../../Definition/saveModelToJson";
import StratumOrder from "../../Definition/StratumOrder";
import Terria from "../../Terria";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export class ApiTableStratum extends LoadableStratum(
  ApiTableCatalogItemTraits
) {
  static stratumName = "apiTable";

  duplicateLoadableStratum(model: BaseModel): this {
    return new ApiTableStratum(model as ApiTableCatalogItem) as this;
  }

  constructor(private readonly catalogItem: ApiTableCatalogItem) {
    super();
  }

  // Set time id columns to `idKey`
  @computed get defaultStyle() {
    return createStratumInstance(TableStyleTraits, {
      time: createStratumInstance(TableTimeStyleTraits, {
        idColumns: this.catalogItem.idKey ? [this.catalogItem.idKey] : undefined
      })
    });
  }
}

StratumOrder.addLoadStratum(ApiTableStratum.stratumName);
/**
 * THE API AND TRAITS OF THIS EXPERIMENTAL CATALOG ITEM SHOULD BE CONSIDERED IN
 * ALPHA. EXPECT BREAKING CHANGES.
 *
 * This is a generic, one-size-fits-most catalog item for deriving tables from
 * external APIs. Currently only supports JSON APIs, and doesn't support region
 * mapping. Also currently only supports a single API to get values from, and a
 * single API to get positions from.
 */
export class ApiTableCatalogItem extends AutoRefreshingMixin(
  TableMixin(CatalogMemberMixin(CreateModel(ApiTableCatalogItemTraits)))
) {
  static readonly type = "api-table";

  get type() {
    return ApiTableCatalogItem.type;
  }

  @observable private apiResponses: any[] = [];
  @observable private hasData: boolean = false;

  constructor(id: string | undefined, terria: Terria) {
    super(id, terria);
    this.strata.set(
      TableAutomaticStylesStratum.stratumName,
      new TableAutomaticStylesStratum(this)
    );
    this.strata.set(ApiTableStratum.stratumName, new ApiTableStratum(this));
  }

  @computed
  get apiDataIsLoaded(): boolean {
    return this.apiResponses.length > 0;
  }

  protected loadDataFromApis() {
    const apisWithUrl = this.apis.filter(api => api.url);
    const apiUrls = apisWithUrl.map(api => proxyCatalogItemUrl(this, api.url!));
    return Promise.all(
      apisWithUrl.map(async (api, idx) => {
        let data = await loadJson(
          apiUrls[idx],
          undefined,
          api.requestData
            ? saveModelToJson((api.requestData as unknown) as BaseModel)
            : undefined,
          api.postRequestDataAsFormData
        );
        if (api.responseDataPath !== undefined) {
          data = _get(data, api.responseDataPath);
        }
        return Promise.resolve({
          data,
          api
        });
      })
    ).then((values: { data: any[]; api: Model<ApiTableRequestTraits> }[]) => {
      runInAction(() => {
        const columnMajorData: Map<string, any> = new Map();
        values
          .filter(val => val.api.kind === "COLUMN_MAJOR") // column major rows only
          .map((val, i) => {
            // add the column name to each column
            (val.data as any)["TERRIA_columnName"] =
              val.api.columnMajorColumnNames[i];
            return val.data;
          })
          .flat()
          // make row id/data pairs for columnMajorData map
          .map(data => Object.entries(data))
          .flat()
          // merge rows with the same id
          .forEach(rowPart => {
            const id = rowPart[0];
            const value: any = rowPart[1];
            const row: any = {};
            row["value"] = value; // add the id to the row's data
            row[this.idKey!] = id;
            if (columnMajorData.has(id)) {
              let currentRow = columnMajorData.get(id);
              columnMajorData.set(id, { currentRow, ...value });
            } else {
              columnMajorData.set(id, row);
            }
          });

        if (columnMajorData.size !== 0) {
          this.apiResponses = Array.from(columnMajorData.values());
          return;
        }

        // Make map of ids to values that are constant for that id
        const perIdData: Map<string, any> = new Map(
          values
            .filter(val => val.api.kind === "PER_ID") // per id only
            .map(val => val.data) // throw away api, keep data
            .reduce((curr, prev) => curr.concat(prev), []) // flatten
            // make id/data pair for perIdData map
            .map(data => [data[this.idKey!], data])
        );

        // Merge PER_ID data with *all* PER_ROW data (this may result in the same PER_ID data row being added to multiple PER_ROW data row)
        const perRowData = values
          .filter(val => val.api.kind === "PER_ROW")
          .map(val => val.data)
          .reduce((curr, prev) => curr.concat(prev), [])
          .map(row =>
            Object.assign(
              row,
              isDefined(row[this.idKey!]) ? perIdData.get(row[this.idKey!]) : {}
            )
          );

        this.apiResponses = perRowData;
      });
    });
  }

  protected makeTableColumns(addHeaders: boolean) {
    return this.columns.map(col => (addHeaders ? [col.name ?? ""] : []));
  }

  protected apiResponseToTable() {
    const columnMajorTable = this.makeTableColumns(!this.hasData);

    if (!this.apiDataIsLoaded) {
      // No data yet, just return the headers
      return columnMajorTable;
    }
    // Fill in column values from the API response
    this.apiResponses.forEach(response => {
      this.columns.forEach((col, mappingIdx) => {
        if (!isDefined(col.name)) return;
        // Append the new value to the correct column
        columnMajorTable[mappingIdx].push(`${response[col.name] ?? ""}`);
      });
    });

    return columnMajorTable;
  }

  protected async forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  protected async forceLoadTableData(): Promise<string[][] | undefined> {
    return this.loadDataFromApis()
      .then(() => {
        runInAction(() => {
          const newTableData = this.apiResponseToTable();
          this.shouldAppendNewData
            ? this.append(newTableData)
            : (this.dataColumnMajor = newTableData);
          this.hasData = true;
        });
      })
      .then(() => undefined);
  }

  refreshData(): void {
    this.loadDataFromApis().then(() => {
      runInAction(() => {
        const newTableData = this.apiResponseToTable();
        this.shouldAppendNewData
          ? this.append(newTableData)
          : (this.dataColumnMajor = newTableData);
      });
    });
  }

  protected addQueryParams(api: Model<ApiRequestTraits>): string {
    const uri = new URI(api.url);

    const substituteDateTimesInQueryParam = (param: string) => {
      if (param.startsWith("DATE!")) {
        const dateFormatString = param.slice(param.indexOf("!") + 1);
        const now = new Date();
        return dateFormat(now, dateFormatString);
      }
      return param;
    };

    // Add common query parameters
    let useUpdateParams = this.hasData && this.updateQueryParameters.length > 0;
    const commonQueryParameters = useUpdateParams
      ? this.updateQueryParameters
      : this.queryParameters;
    commonQueryParameters.forEach(query => {
      uri.addQuery(query.name!, substituteDateTimesInQueryParam(query.value!));
    });

    // Add API-specific query parameters
    useUpdateParams = this.hasData && api.updateQueryParameters.length > 0;
    const specificQueryParameters = useUpdateParams
      ? api.updateQueryParameters
      : api.queryParameters;
    specificQueryParameters.forEach(query => {
      uri.addQuery(query.name!, substituteDateTimesInQueryParam(query.value!));
    });

    return uri.toString();
  }
}

StratumOrder.addLoadStratum(TableAutomaticStylesStratum.stratumName);
