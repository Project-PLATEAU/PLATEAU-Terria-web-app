import { Share } from "catalog-converter";
import i18next from "i18next";
import { action, computed, observable, runInAction, toJS, when } from "mobx";
import { createTransformer } from "mobx-utils";
import Clock from "terriajs-cesium/Source/Core/Clock";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import queryToObject from "terriajs-cesium/Source/Core/queryToObject";
import RequestScheduler from "terriajs-cesium/Source/Core/RequestScheduler";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import URI from "urijs";
import { Category, LaunchAction } from "../Core/AnalyticEvents/analyticEvents";
import AsyncLoader from "../Core/AsyncLoader";
import Class from "../Core/Class";
import ConsoleAnalytics from "../Core/ConsoleAnalytics";
import CorsProxy from "../Core/CorsProxy";
import filterOutUndefined from "../Core/filterOutUndefined";
import getDereferencedIfExists from "../Core/getDereferencedIfExists";
import GoogleAnalytics from "../Core/GoogleAnalytics";
import hashEntity from "../Core/hashEntity";
import instanceOf from "../Core/instanceOf";
import isDefined from "../Core/isDefined";
import JsonValue, {
  isJsonArray,
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonArray,
  JsonObject
} from "../Core/Json";
import { isLatLonHeight } from "../Core/LatLonHeight";
import loadJson5 from "../Core/loadJson5";
import Result from "../Core/Result";
import ServerConfig from "../Core/ServerConfig";
import TerriaError, {
  TerriaErrorOverrides,
  TerriaErrorSeverity
} from "../Core/TerriaError";
import { Complete } from "../Core/TypeModifiers";
import { getUriWithoutPath } from "../Core/uriHelpers";
import PickedFeatures, {
  featureBelongsToCatalogItem,
  isProviderCoordsMap
} from "../Map/PickedFeatures";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import MappableMixin, { isDataSource } from "../ModelMixins/MappableMixin";
import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import TimeVarying from "../ModelMixins/TimeVarying";
import { HelpContentItem } from "../ReactViewModels/defaultHelpContent";
import { defaultTerms, Term } from "../ReactViewModels/defaultTerms";
import NotificationState from "../ReactViewModels/NotificationState";
import { SHARE_VERSION } from "../ReactViews/Map/Panels/SharePanel/BuildShareLink";
import { shareConvertNotification } from "../ReactViews/Notification/shareConvertNotification";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";
import MapNavigationModel from "../ViewModels/MapNavigation/MapNavigationModel";
import TerriaViewer from "../ViewModels/TerriaViewer";
import { BaseMapsModel } from "./BaseMaps/BaseMapsModel";
import CameraView from "./CameraView";
import Catalog from "./Catalog/Catalog";
import CatalogGroup from "./Catalog/CatalogGroup";
import CatalogMemberFactory from "./Catalog/CatalogMemberFactory";
import MagdaReference, {
  MagdaReferenceHeaders
} from "./Catalog/CatalogReferences/MagdaReference";
import SplitItemReference from "./Catalog/CatalogReferences/SplitItemReference";
import CommonStrata from "./Definition/CommonStrata";
import hasTraits from "./Definition/hasTraits";
import { BaseModel } from "./Definition/Model";
import updateModelFromJson from "./Definition/updateModelFromJson";
import upsertModelFromJson from "./Definition/upsertModelFromJson";
import {
  ErrorServiceOptions,
  ErrorServiceProvider,
  initializeErrorServiceProvider
} from "./ErrorServiceProviders/ErrorService";
import StubErrorServiceProvider from "./ErrorServiceProviders/StubErrorServiceProvider";
import Feature from "./Feature";
import GlobeOrMap from "./GlobeOrMap";
import IElementConfig from "./IElementConfig";
import InitSource, {
  isInitData,
  isInitDataPromise,
  isInitOptions,
  isInitUrl
} from "./InitSource";
import Internationalization, {
  I18nStartOptions,
  LanguageConfiguration
} from "./Internationalization";
import MapInteractionMode from "./MapInteractionMode";
import NoViewer from "./NoViewer";
import CatalogIndex from "./SearchProviders/CatalogIndex";
import ShareDataService from "./ShareDataService";
import TimelineStack from "./TimelineStack";
import { isViewerMode, setViewerMode } from "./ViewerMode";
import Workbench from "./Workbench";

// import overrides from "../Overrides/defaults.jsx";

interface ConfigParameters {
  /**
   * TerriaJS uses this name whenever it needs to display the name of the application.
   */
  appName?: string;
  /**
   * The email address shown when things go wrong.
   */
  supportEmail?: string;
  /**
   * The maximum number of "feature info" boxes that can be displayed when clicking a point.
   */
  defaultMaximumShownFeatureInfos: number;
  /**
   * URL of the JSON file that contains index of catalog.
   */
  catalogIndexUrl?: string;
  /**
   * URL of the JSON file that defines region mapping for CSV files.
   */
  regionMappingDefinitionsUrl: string;
  /**
   * URL of OGR2OGR conversion service (part of TerriaJS-Server).
   */
  conversionServiceBaseUrl?: string;
  /**
   * URL of Proj4 projection lookup service (part of TerriaJS-Server).
   */
  proj4ServiceBaseUrl?: string;
  /**
   * URL of CORS proxy service (part of TerriaJS-Server)
   */
  corsProxyBaseUrl?: string;
  /**
   * @deprecated
   */
  proxyableDomainsUrl?: string;
  serverConfigUrl?: string;
  shareUrl?: string;
  /**
   * URL of the service used to send feedback.  If not specified, the "Give Feedback" button will not appear.
   */
  feedbackUrl?: string;
  /**
   * An array of base paths to use to try to use to resolve init fragments in the URL.  For example, if this property is `[ "init/", "http://example.com/init/"]`, then a URL with `#test` will first try to load `init/test.json` and, if that fails, next try to load `http://example.com/init/test.json`.
   */
  initFragmentPaths: string[];
  /**
   * Whether the story is enabled. If false story function button won't be available.
   */
  storyEnabled: boolean;
  /**
   * True (the default) to intercept the browser's print feature and use a custom one accessible through the Share panel.
   */
  interceptBrowserPrint?: boolean;
  /**
   * True to create a separate explorer panel tab for each top-level catalog group to list its items in.
   */
  tabbedCatalog?: boolean;
  /**
   * True to use Cesium World Terrain from Cesium ion. False to use terrain from the URL specified with the `"cesiumTerrainUrl"` property. If this property is false and `"cesiumTerrainUrl"` is not specified, the 3D view will use a smooth ellipsoid instead of a terrain surface. Defaults to true.
   */
  useCesiumIonTerrain?: boolean;
  /**
   * The URL to use for Cesium terrain in the 3D Terrain viewer, in quantized mesh format. This property is ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainUrl?: string;
  /**
   * The Cesium Ion Asset ID to use for Cesium terrain in the 3D Terrain viewer. `cesiumIonAccessToken` will be used to authenticate. This property is ignored if "useCesiumIonTerrain" is set to true.
   */
  cesiumTerrainAssetId?: number;
  /**
   * The access token to use with Cesium ion. If `"useCesiumIonTerrain"` is true and this property is not specified, the Cesium default Ion key will be used. It is a violation of the Ion terms of use to use the default key in a deployed application.
   */
  cesiumIonAccessToken?: string;
  /**
   * True to use Bing Maps from Cesium ion (Cesium World Imagery). By default, Ion will be used, unless the `bingMapsKey` property is specified, in which case that will be used instead. To disable the Bing Maps layers entirely, set this property to false and set `bingMapsKey` to null.
   */
  useCesiumIonBingImagery?: boolean;
  /**
   * A [Bing Maps API key](https://msdn.microsoft.com/en-us/library/ff428642.aspx) used for requesting Bing Maps base maps and using the Bing Maps geocoder for searching. It is your responsibility to request a key and comply with all terms and conditions.
   */
  bingMapsKey?: string;
  hideTerriaLogo?: boolean;
  /**
   * An array of strings of HTML that fill up the top left logo space (see `brandBarSmallElements` or `displayOneBrand` for small screens).
   */
  brandBarElements?: string[];
  /**
   * An array of strings of HTML that fill up the top left logo space - used for small screens.
   */
  brandBarSmallElements?: string[];
  /**
   * Index of which `brandBarElements` to show for mobile header. This will be used if `this.brandBarSmallElements` is undefined.
   */
  displayOneBrand?: number;
  /**
   * True to disable the "Centre map at your current location" button.
   */
  disableMyLocation?: boolean;
  disableSplitter?: boolean;

  disablePedestrianMode?: boolean;

  experimentalFeatures?: boolean;
  magdaReferenceHeaders?: MagdaReferenceHeaders;
  locationSearchBoundingBox?: number[];
  /**
   * A Google API key for [Google Analytics](https://analytics.google.com).  If specified, TerriaJS will send various events about how it's used to Google Analytics.
   */
  googleAnalyticsKey?: string;

  /**
   * Error service provider configuration.
   */
  errorService?: ErrorServiceOptions;

  globalDisclaimer?: any;
  /**
   * True to display welcome message on startup.
   */
  showWelcomeMessage?: boolean;

  // TODO: make themeing TS
  /** Theme overrides, this is applied in StandardUserInterface and merged in order of highest priority:
   *  `StandardUserInterface.jsx` `themeOverrides` prop -> `theme` config parameter (this object) -> default `terriaTheme` (see `StandardTheme.jsx`)
   */
  theme?: any;
  /**
   * Video to show in welcome message.
   */
  welcomeMessageVideo?: any;
  /**
   * True to display in-app guides.
   */
  showInAppGuides?: boolean;
  /**
   * The content to be displayed in the help panel.
   */
  helpContent?: HelpContentItem[];
  helpContentTerms?: Term[];
  /**
   *
   */
  languageConfiguration?: LanguageConfiguration;
  /**
   * Custom concurrent request limits for domains in Cesium's RequestScheduler. Cesium's default is 6 per domain (the maximum allowed by browsers unless the server supports http2). For servers supporting http2 try 12-24 to have more parallel requests. Setting this too high will undermine Cesium's prioritised request scheduling and important data may load slower. Format is {"domain_without_protocol:port": number}.
   */
  customRequestSchedulerLimits?: Record<string, number>;

  /**
   * Whether to load persisted viewer mode from local storage.
   */
  persistViewerMode?: boolean;

  /**
   * Whether to open the add data explorer panel on load.
   */
  openAddData?: boolean;

  /**
   * Text showing at the top of feedback form.
   */
  feedbackPreamble?: string;

  /**
   * Text showing at the bottom of feedback form.
   */
  feedbackPostamble?: string;
  /**
   * Minimum length of feedback comment.
   */
  feedbackMinLength?: number;

  /**
   * Extra links to show in the credit line at the bottom of the map (currently only the Cesium map).
   */
  extraCreditLinks?: { url: string; text: string }[];

  /**
   * Configurable discalimer that shows up in print view
   */
  printDisclaimer?: { url: string; text: string };
}

interface StartOptions {
  configUrl: string;
  configUrlHeaders?: {
    [key: string]: string;
  };
  applicationUrl?: Location;
  shareDataService?: ShareDataService;
  /**
   * i18nOptions is explicitly a separate option from `languageConfiguration`,
   * as `languageConfiguration` can be serialised, but `i18nOptions` may have
   * some functions that are passed in from a TerriaMap
   *  */
  i18nOptions?: I18nStartOptions;
}

interface Analytics {
  start: (
    userParameters: Partial<{
      logToConsole: boolean;
      googleAnalyticsKey: any;
      googleAnalyticsOptions: any;
    }>
  ) => void;
  logEvent: (
    category: string,
    action: string,
    label?: string,
    value?: string
  ) => void;
}

interface TerriaOptions {
  baseUrl?: string;
  analytics?: Analytics;
}

interface ApplyInitDataOptions {
  initData: JsonObject;
  replaceStratum?: boolean;
  // When feature picking state is missing from the initData, unset the state only if this flag is true
  // This is for eg, set to true when switching through story slides.
  canUnsetFeaturePickingState?: boolean;
}

interface HomeCameraInit {
  [key: string]: HomeCameraInit[keyof HomeCameraInit];
  north: number;
  east: number;
  south: number;
  west: number;
}

export default class Terria {
  private readonly models = observable.map<string, BaseModel>();

  /** Map from share key -> id */
  readonly shareKeysMap = observable.map<string, string>();
  /** Map from id -> share keys */
  readonly modelIdShareKeysMap = observable.map<string, string[]>();

  readonly baseUrl: string = "build/TerriaJS/";

  readonly tileLoadProgressEvent = new CesiumEvent();
  readonly workbench = new Workbench();
  readonly overlays = new Workbench();
  readonly catalog = new Catalog(this);
  readonly baseMapsModel = new BaseMapsModel("basemaps", this);
  readonly timelineClock = new Clock({ shouldAnimate: false });
  // readonly overrides: any = overrides; // TODO: add options.functionOverrides like in master

  catalogIndex: CatalogIndex | undefined;

  readonly elements = observable.map<string, IElementConfig>();

  @observable
  readonly mainViewer = new TerriaViewer(
    this,
    computed(() =>
      filterOutUndefined(
        this.overlays.items
          .map(item => (MappableMixin.isMixedInto(item) ? item : undefined))
          .concat(
            this.workbench.items.map(item =>
              MappableMixin.isMixedInto(item) ? item : undefined
            )
          )
      )
    )
  );

  appName: string = "TerriaJS App";
  supportEmail: string = "info@terria.io";

  /**
   * Gets or sets the {@link this.corsProxy} used to determine if a URL needs to be proxied and to proxy it if necessary.
   * @type {CorsProxy}
   */
  corsProxy: CorsProxy = new CorsProxy();

  /**
   * Gets or sets the instance to which to report Google Analytics-style log events.
   * If a global `ga` function is defined, this defaults to `GoogleAnalytics`.  Otherwise, it defaults
   * to `ConsoleAnalytics`.
   */
  readonly analytics: Analytics | undefined;

  /**
   * Gets the stack of layers active on the timeline.
   */
  readonly timelineStack = new TimelineStack(this.timelineClock);

  @observable
  readonly configParameters: Complete<ConfigParameters> = {
    appName: "TerriaJS App",
    supportEmail: "info@terria.io",
    defaultMaximumShownFeatureInfos: 100,
    catalogIndexUrl: undefined,
    regionMappingDefinitionsUrl: "build/TerriaJS/data/regionMapping.json",
    conversionServiceBaseUrl: "convert/",
    proj4ServiceBaseUrl: "proj4def/",
    corsProxyBaseUrl: "proxy/",
    proxyableDomainsUrl: "proxyabledomains/", // deprecated, will be determined from serverconfig
    serverConfigUrl: "serverconfig/",
    shareUrl: "share",
    feedbackUrl: undefined,
    initFragmentPaths: ["init/"],
    storyEnabled: true,
    interceptBrowserPrint: true,
    tabbedCatalog: false,
    useCesiumIonTerrain: true,
    cesiumTerrainUrl: undefined,
    cesiumTerrainAssetId: undefined,
    cesiumIonAccessToken: undefined,
    useCesiumIonBingImagery: undefined,
    bingMapsKey: undefined,
    hideTerriaLogo: false,
    brandBarElements: undefined,
    brandBarSmallElements: undefined,
    displayOneBrand: 0,
    disableMyLocation: undefined,
    disableSplitter: undefined,
    disablePedestrianMode: false,
    experimentalFeatures: undefined,
    magdaReferenceHeaders: undefined,
    locationSearchBoundingBox: undefined,
    googleAnalyticsKey: undefined,
    errorService: undefined,
    globalDisclaimer: undefined,
    theme: {},
    showWelcomeMessage: false,
    welcomeMessageVideo: {
      videoTitle: "Getting started with the map",
      videoUrl: "https://www.youtube-nocookie.com/embed/FjSxaviSLhc",
      placeholderImage:
        "https://img.youtube.com/vi/FjSxaviSLhc/maxresdefault.jpg"
    },
    showInAppGuides: false,
    helpContent: [],
    helpContentTerms: defaultTerms,
    languageConfiguration: undefined,
    customRequestSchedulerLimits: undefined,
    persistViewerMode: true,
    openAddData: false,
    feedbackPreamble: "translate#feedback.feedbackPreamble",
    feedbackPostamble: undefined,
    feedbackMinLength: 0,
    extraCreditLinks: [
      // Default credit links (shown at the bottom of the Cesium map)
      {
        text: "map.extraCreditLinks.dataAttribution",
        url: "about.html#data-attribution"
      },
      { text: "map.extraCreditLinks.disclaimer", url: "about.html#disclaimer" }
    ],
    printDisclaimer: undefined
  };

  @observable
  pickedFeatures: PickedFeatures | undefined;

  @observable
  selectedFeature: Feature | undefined;

  @observable
  allowFeatureInfoRequests: boolean = true;

  /**
   * Gets or sets the stack of map interactions modes.  The mode at the top of the stack
   * (highest index) handles click interactions with the map
   */
  @observable
  mapInteractionModeStack: MapInteractionMode[] = [];

  @computed
  get baseMapContrastColor() {
    return (
      this.baseMapsModel.baseMapItems.find(
        basemap =>
          isDefined(basemap.item?.uniqueId) &&
          basemap.item?.uniqueId === this.mainViewer.baseMap?.uniqueId
      )?.contrastColor ?? "#ffffff"
    );
  }

  @observable
  readonly userProperties = new Map<string, any>();

  @observable
  readonly initSources: InitSource[] = [];
  private _initSourceLoader = new AsyncLoader(
    this.forceLoadInitSources.bind(this)
  );

  @observable serverConfig: any; // TODO
  @observable shareDataService: ShareDataService | undefined;

  /* Splitter controls */
  @observable showSplitter = false;
  @observable splitPosition = 0.5;
  @observable splitPositionVertical = 0.5;
  @observable terrainSplitDirection: ImagerySplitDirection =
    ImagerySplitDirection.NONE;

  @observable depthTestAgainstTerrainEnabled = false;

  @observable stories: any[] = [];

  /**
   * Gets or sets the ID of the catalog member that is currently being
   * previewed. This is observed in ViewState. It is used to open "Add data" if a catalog member is open in a share link.
   * This should stay private - use viewState.viewCatalogMember() instead
   */
  @observable private _previewedItemId: string | undefined;
  get previewedItemId() {
    return this._previewedItemId;
  }

  /**
   * Base ratio for maximumScreenSpaceError
   * @type {number}
   */
  @observable baseMaximumScreenSpaceError = 2;

  /**
   * Model to use for map navigation
   */
  @observable mapNavigationModel: MapNavigationModel = new MapNavigationModel(
    this
  );

  /**
   * Gets or sets whether to use the device's native resolution (sets cesium.viewer.resolutionScale to a ratio of devicePixelRatio)
   * @type {boolean}
   */
  @observable useNativeResolution = false;

  /**
   * Whether we think all references in the catalog have been loaded
   * @type {boolean}
   */
  @observable catalogReferencesLoaded: boolean = false;

  /**
   * click時のモードを制御する為の識別子
   * @type {number}
   */
  @observable mode = 0;
  /**
   * 経路検索におけるスタート地点の経度緯度
   * @type {string}
   */
  @observable routeStart = "";

  /**
    * 経路検索における終了地点の経度緯度
    * @type {string}
    */
  @observable routeEnd = "";
  
  /**
    * click地点の経度緯度
    * @type {string}
    */
  @observable clickLatLong = "";
  /**
   * clickMode（クリックの状態管理）をセット
   * @param {number}
   */
  @action
  setMode(mode: number) {
    this.mode = mode;
  }
  /**
   * 経路探索 開始地点の緯度経度をセット
   * @param {string}
   */
  @action
  setRouteStart(routeStart: string) {
    this.routeStart = routeStart;
  }

  /**
   * 経路探索 終了地点の緯度経度をセット
   * @param {string}
   */
  @action
  setRouteEnd(routeEnd: string) {
    this.routeEnd = routeEnd;
  }

  /**
   * クリックされた地点の緯度経度をセット
   * @param {string}
   */
  @action
  setClickLatLong(clickLatLong: string) {
    this.clickLatLong = clickLatLong;
  }
  augmentedVirtuality?: any;

  readonly notificationState: NotificationState = new NotificationState();

  private readonly developmentEnv = process?.env?.NODE_ENV === "development";

  /**
   * An error service instance. The instance can be configured by setting the
   * `errorService` config parameter. Here we initialize it to stub provider so
   * that the `terria.errorService` always exists.
   */
  errorService: ErrorServiceProvider = new StubErrorServiceProvider();

  constructor(options: TerriaOptions = {}) {
    if (options.baseUrl) {
      if (options.baseUrl.lastIndexOf("/") !== options.baseUrl.length - 1) {
        this.baseUrl = options.baseUrl + "/";
      } else {
        this.baseUrl = options.baseUrl;
      }
    }

    this.analytics = options.analytics;
    if (!defined(this.analytics)) {
      if (typeof window !== "undefined" && defined((<any>window).ga)) {
        this.analytics = new GoogleAnalytics();
      } else {
        this.analytics = new ConsoleAnalytics();
      }
    }
  }

  /** Raise error to user.
   *
   * This accepts same arguments as `TerriaError.from` - but also has:
   *
   * @param forceRaiseToUser - which can be used to force raise the error
   */
  raiseErrorToUser(
    error: unknown,
    overrides?: TerriaErrorOverrides,
    forceRaiseToUser = false
  ) {
    const terriaError = TerriaError.from(error, overrides);

    // Set shouldRaiseToUser true if forceRaiseToUser agrument is true
    if (forceRaiseToUser) terriaError.overrideRaiseToUser = true;

    // Log error to error service
    this.errorService.error(terriaError);

    // Only show error to user if `ignoreError` flag hasn't been set to "1"
    // Note: this will take precedence over forceRaiseToUser/overrideRaiseToUser
    if (this.userProperties.get("ignoreErrors") !== "1")
      this.notificationState.addNotificationToQueue(
        terriaError.toNotification()
      );

    terriaError.log();
  }

  @computed
  get currentViewer(): GlobeOrMap {
    return this.mainViewer.currentViewer;
  }

  @computed
  get cesium(): import("./Cesium").default | undefined {
    if (
      isDefined(this.mainViewer) &&
      this.mainViewer.currentViewer.type === "Cesium"
    ) {
      return this.mainViewer.currentViewer as import("./Cesium").default;
    }
  }

  @computed
  get leaflet(): import("./Leaflet").default | undefined {
    if (
      isDefined(this.mainViewer) &&
      this.mainViewer.currentViewer.type === "Leaflet"
    ) {
      return this.mainViewer.currentViewer as import("./Leaflet").default;
    }
  }

  @computed get modelValues() {
    return Array.from(this.models.values());
  }

  @computed
  get modelIds() {
    return Array.from(this.models.keys());
  }

  getModelById<T extends BaseModel>(type: Class<T>, id: string): T | undefined {
    const model = this.models.get(id);
    if (instanceOf(type, model)) {
      return model;
    }

    // Model does not have the requested type.
    return undefined;
  }

  @action
  addModel(model: BaseModel, shareKeys?: string[]) {
    if (model.uniqueId === undefined) {
      throw new DeveloperError("A model without a `uniqueId` cannot be added.");
    }

    if (this.models.has(model.uniqueId)) {
      throw new RuntimeError(
        `A model with the specified ID already exists: \`${model.uniqueId}\``
      );
    }

    this.models.set(model.uniqueId, model);
    shareKeys?.forEach(shareKey => this.addShareKey(model.uniqueId!, shareKey));
  }

  /**
   * Remove references to a model from Terria.
   */
  @action
  removeModelReferences(model: BaseModel) {
    this.removeSelectedFeaturesForModel(model);
    this.workbench.remove(model);
    if (model.uniqueId) {
      this.models.delete(model.uniqueId);
    }
  }

  @action
  removeSelectedFeaturesForModel(model: BaseModel) {
    const pickedFeatures = this.pickedFeatures;
    if (pickedFeatures) {
      // Remove picked features that belong to the catalog item
      pickedFeatures.features.forEach((feature, i) => {
        if (featureBelongsToCatalogItem(<Feature>feature, model)) {
          pickedFeatures?.features.splice(i, 1);
          if (this.selectedFeature === feature)
            this.selectedFeature = undefined;
        }
      });
    }
  }

  getModelIdByShareKey(shareKey: string): string | undefined {
    return this.shareKeysMap.get(shareKey);
  }

  getModelByIdOrShareKey<T extends BaseModel>(
    type: Class<T>,
    id: string
  ): T | undefined {
    let model = this.getModelById(type, id);
    if (model) {
      return model;
    } else {
      const idFromShareKey = this.getModelIdByShareKey(id);
      return idFromShareKey !== undefined
        ? this.getModelById(type, idFromShareKey)
        : undefined;
    }
  }

  @action
  addShareKey(id: string, shareKey: string) {
    if (id === shareKey || this.shareKeysMap.has(shareKey)) return;
    this.shareKeysMap.set(shareKey, id);
    this.modelIdShareKeysMap.get(id)?.push(shareKey) ??
      this.modelIdShareKeysMap.set(id, [shareKey]);
  }

  /**
   * Initialize errorService from config parameters.
   */
  setupErrorServiceProvider(errorService: any) {
    initializeErrorServiceProvider(errorService)
      .then(errorService => {
        this.errorService = errorService;
      })
      .catch(e => {
        console.error("Failed to initialize error service", e);
      });
  }

  setupInitializationUrls(baseUri: uri.URI, config: any) {
    const initializationUrls: string[] = config?.initializationUrls || [];
    const initSources: InitSource[] = initializationUrls.map(url => ({
      name: `Init URL from config ${url}`,
      errorSeverity: TerriaErrorSeverity.Error,
      ...generateInitializationUrl(
        baseUri,
        this.configParameters.initFragmentPaths,
        url
      )
    }));

    // look for v7 catalogs -> push v7-v8 conversion to initSources
    if (Array.isArray(config?.v7initializationUrls)) {
      initSources.push(
        ...(config.v7initializationUrls as JsonArray)
          .filter(isJsonString)
          .map(v7initUrl => ({
            name: `V7 Init URL from config ${v7initUrl}`,
            errorSeverity: TerriaErrorSeverity.Error,
            data: (async () => {
              try {
                const [{ convertCatalog }, catalog] = await Promise.all([
                  import("catalog-converter"),
                  loadJson5(v7initUrl)
                ]);
                const convert = convertCatalog(catalog, { generateIds: false });
                console.log(
                  `WARNING: ${v7initUrl} is a v7 catalog - it has been upgraded to v8\nMessages:\n`
                );
                convert.messages.forEach(message =>
                  console.log(`- ${message.path.join(".")}: ${message.message}`)
                );
                return new Result({
                  data: (convert.result as JsonObject | null) || {}
                });
              } catch (error) {
                return Result.error(error, {
                  title: { key: "models.catalog.convertErrorTitle" },
                  message: {
                    key: "models.catalog.convertErrorMessage",
                    parameters: { url: v7initUrl }
                  }
                });
              }
            })()
          }))
      );
    }
    this.initSources.push(...initSources);
  }

  async start(options: StartOptions) {
    // Some hashProperties need to be set before anything else happens
    const hashProperties = queryToObject(new URI(window.location).fragment());

    if (isDefined(hashProperties["ignoreErrors"])) {
      this.userProperties.set("ignoreErrors", hashProperties["ignoreErrors"]);
    }

    this.shareDataService = options.shareDataService;

    // If in development environment, allow usage of #configUrl to set Terria config URL
    if (this.developmentEnv) {
      if (
        isDefined(hashProperties["configUrl"]) &&
        hashProperties["configUrl"] !== ""
      )
        options.configUrl = hashProperties["configUrl"];
    }

    const baseUri = new URI(options.configUrl).filename("");

    const launchUrlForAnalytics =
      options.applicationUrl?.href || getUriWithoutPath(baseUri);

    try {
      const config = await loadJson5(
        options.configUrl,
        options.configUrlHeaders
      );

      // If it's a magda config, we only load magda config and parameters should never be a property on the direct
      // config aspect (it would be under the `terria-config` aspect)
      if (isJsonObject(config) && config.aspects) {
        await this.loadMagdaConfig(options.configUrl, config, baseUri);
      }
      runInAction(() => {
        if (isJsonObject(config) && isJsonObject(config.parameters)) {
          this.updateParameters(config.parameters);
        }
        if (this.configParameters.errorService) {
          this.setupErrorServiceProvider(this.configParameters.errorService);
        }
        this.setupInitializationUrls(baseUri, config);
      });
    } catch (error) {
      this.raiseErrorToUser(error, {
        sender: this,
        title: { key: "models.terria.loadConfigErrorTitle" },
        message: `Couldn't load ${options.configUrl}`,
        severity: TerriaErrorSeverity.Error
      });
    } finally {
      if (!options.i18nOptions?.skipInit) {
        Internationalization.initLanguage(
          this.configParameters.languageConfiguration,
          options.i18nOptions
        );
      }
    }
    setCustomRequestSchedulerDomainLimits(
      this.configParameters.customRequestSchedulerLimits
    );

    this.analytics?.start(this.configParameters);
    this.analytics?.logEvent(
      Category.launch,
      LaunchAction.url,
      launchUrlForAnalytics
    );
    this.serverConfig = new ServerConfig();
    const serverConfig = await this.serverConfig.init(
      this.configParameters.serverConfigUrl
    );
    await this.initCorsProxy(this.configParameters, serverConfig);
    if (this.shareDataService && this.serverConfig.config) {
      this.shareDataService.init(this.serverConfig.config);
    }

    // Create catalog index if catalogIndexUrl is set
    // Note: this isn't loaded now, it is loaded in first CatalogSearchProvider.doSearch()
    if (this.configParameters.catalogIndexUrl && !this.catalogIndex) {
      this.catalogIndex = new CatalogIndex(
        this,
        this.configParameters.catalogIndexUrl
      );
    }

    this.baseMapsModel
      .initializeDefaultBaseMaps()
      .catchError(error =>
        this.raiseErrorToUser(
          TerriaError.from(error, "Failed to load default basemaps")
        )
      );

    if (options.applicationUrl) {
      (await this.updateApplicationUrl(options.applicationUrl.href)).raiseError(
        this
      );
    }
    this.loadPersistedMapSettings();
  }

  loadPersistedMapSettings(): void {
    const persistViewerMode = this.configParameters.persistViewerMode;
    const hashViewerMode = this.userProperties.get("map");
    if (hashViewerMode && isViewerMode(hashViewerMode)) {
      setViewerMode(hashViewerMode, this.mainViewer);
    } else if (persistViewerMode) {
      const viewerMode = <string>this.getLocalProperty("viewermode");
      if (isDefined(viewerMode) && isViewerMode(viewerMode)) {
        setViewerMode(viewerMode, this.mainViewer);
      }
    }
    const useNativeResolution = this.getLocalProperty("useNativeResolution");
    if (typeof useNativeResolution === "boolean") {
      this.setUseNativeResolution(useNativeResolution);
    }

    const baseMaximumScreenSpaceError = parseFloat(
      this.getLocalProperty("baseMaximumScreenSpaceError")?.toString() || ""
    );
    if (!isNaN(baseMaximumScreenSpaceError)) {
      this.setBaseMaximumScreenSpaceError(baseMaximumScreenSpaceError);
    }
  }

  @action
  setUseNativeResolution(useNativeResolution: boolean) {
    this.useNativeResolution = useNativeResolution;
  }

  @action
  setBaseMaximumScreenSpaceError(baseMaximumScreenSpaceError: number): void {
    this.baseMaximumScreenSpaceError = baseMaximumScreenSpaceError;
  }

  async loadPersistedOrInitBaseMap() {
    const baseMapItems = this.baseMapsModel.baseMapItems;
    // Set baseMap fallback to first option
    let baseMap = baseMapItems[0];
    const persistedBaseMapId = this.getLocalProperty("basemap");
    const baseMapSearch = baseMapItems.find(
      baseMapItem => baseMapItem.item?.uniqueId === persistedBaseMapId
    );
    if (baseMapSearch?.item && MappableMixin.isMixedInto(baseMapSearch.item)) {
      baseMap = baseMapSearch;
    } else {
      // Try to find basemap using defaultBaseMapId and defaultBaseMapName
      const baseMapSearch =
        baseMapItems.find(
          baseMapItem =>
            baseMapItem.item?.uniqueId === this.baseMapsModel.defaultBaseMapId
        ) ??
        baseMapItems.find(
          baseMapItem =>
            CatalogMemberMixin.isMixedInto(baseMapItem) &&
            (<any>baseMapItem.item).name ===
              this.baseMapsModel.defaultBaseMapName
        );
      if (
        baseMapSearch?.item &&
        MappableMixin.isMixedInto(baseMapSearch.item)
      ) {
        baseMap = baseMapSearch;
      }
    }
    await this.mainViewer.setBaseMap(<MappableMixin.Instance>baseMap.item);
  }

  get isLoadingInitSources(): boolean {
    return this._initSourceLoader.isLoading;
  }

  /**
   * Asynchronously loads init sources
   */
  loadInitSources() {
    return this._initSourceLoader.load();
  }

  dispose() {
    this._initSourceLoader.dispose();
  }

  async updateFromStartData(
    startData: unknown,
    /** Name for startData initSources - this is only used for debugging purposes */
    name: string = "Application start data",
    /** Error severity to use for loading startData init sources - default will be `TerriaErrorSeverity.Error` */
    errorSeverity?: TerriaErrorSeverity
  ) {
    try {
      await interpretStartData(this, startData, name, errorSeverity);
    } catch (e) {
      return Result.error(e);
    }

    return await this.loadInitSources();
  }

  async updateApplicationUrl(newUrl: string) {
    const uri = new URI(newUrl);
    const hash = uri.fragment();
    const hashProperties = queryToObject(hash);

    try {
      await interpretHash(
        this,
        hashProperties,
        this.userProperties,
        new URI(newUrl)
          .filename("")
          .query("")
          .hash("")
      );
    } catch (e) {
      this.raiseErrorToUser(e);
    }

    return await this.loadInitSources();
  }

  @action
  updateParameters(parameters: ConfigParameters | JsonObject): void {
    Object.entries(parameters).forEach(([key, value]) => {
      if (this.configParameters.hasOwnProperty(key)) {
        (this.configParameters as any)[key] = value;
      }
    });

    this.appName = defaultValue(this.configParameters.appName, this.appName);
    this.supportEmail = defaultValue(
      this.configParameters.supportEmail,
      this.supportEmail
    );
  }

  protected async forceLoadInitSources(): Promise<void> {
    const loadInitSource = createTransformer(
      async (initSource: InitSource): Promise<JsonObject | undefined> => {
        let jsonValue: JsonValue | undefined;
        if (isInitUrl(initSource)) {
          try {
            jsonValue = await loadJson5(initSource.initUrl);
          } catch (e) {
            throw TerriaError.from(e, {
              message: {
                key: "models.terria.loadingInitJsonMessage",
                parameters: { url: initSource.initUrl }
              }
            });
          }
        } else if (isInitOptions(initSource)) {
          let error: unknown;
          for (const option of initSource.options) {
            try {
              jsonValue = await loadInitSource(option);
              if (jsonValue !== undefined) break;
            } catch (err) {
              error = err;
            }
          }
          if (jsonValue === undefined && error !== undefined) throw error;
        } else if (isInitData(initSource)) {
          jsonValue = initSource.data;
        } else if (isInitDataPromise(initSource)) {
          jsonValue = (await initSource.data).throwIfError()?.data;
        }

        if (jsonValue && isJsonObject(jsonValue)) {
          return jsonValue;
        }
        return undefined;
      }
    );

    const errors: TerriaError[] = [];

    // Load all init sources
    const loadedInitSources = await Promise.all(
      this.initSources.map(async initSource => {
        try {
          return {
            ...initSource,
            data: await loadInitSource(initSource)
          };
        } catch (e) {
          errors.push(
            TerriaError.from(e, {
              severity: initSource.errorSeverity,
              message: {
                key: "models.terria.loadingInitSourceError2Message",
                parameters: { loadSource: initSource.name ?? "Unknown source" }
              }
            })
          );
        }
      })
    );

    // Apply all init sources
    await Promise.all(
      loadedInitSources.map(async initSource => {
        if (!isDefined(initSource?.data)) return;
        try {
          await this.applyInitData({
            initData: initSource!.data
          });
        } catch (e) {
          errors.push(
            TerriaError.from(e, {
              severity: initSource?.errorSeverity,
              message: {
                key: "models.terria.loadingInitSourceError2Message",
                parameters: { loadSource: initSource!.name ?? "Unknown source" }
              }
            })
          );
        }
      })
    );

    // Load basemap
    runInAction(() => {
      if (!this.mainViewer.baseMap) {
        // Note: there is no "await" here - as basemaps can take a while to load and there is no need to wait for them to load before rendering Terria
        this.loadPersistedOrInitBaseMap();
      }
    });

    if (errors.length > 0) {
      // Note - this will get wrapped up in a Result object because it is called in AsyncLoader
      throw TerriaError.combine(errors, {
        title: { key: "models.terria.loadingInitSourcesErrorTitle" },
        message: {
          key: "models.terria.loadingInitSourcesErrorMessage",
          parameters: { appName: this.appName, email: this.supportEmail }
        }
      });
    }
  }

  private async loadModelStratum(
    modelId: string,
    stratumId: string,
    allModelStratumData: JsonObject,
    replaceStratum: boolean
  ): Promise<Result<BaseModel | undefined>> {
    const thisModelStratumData = allModelStratumData[modelId] || {};
    if (!isJsonObject(thisModelStratumData)) {
      throw new TerriaError({
        sender: this,
        title: "Invalid model traits",
        message: "The traits of a model must be a JSON object."
      });
    }

    const cleanStratumData = { ...thisModelStratumData };
    delete cleanStratumData.dereferenced;
    delete cleanStratumData.knownContainerUniqueIds;

    const errors: TerriaError[] = [];

    const containerIds = thisModelStratumData.knownContainerUniqueIds;
    if (Array.isArray(containerIds)) {
      // Groups that contain this item must be loaded before this item.
      await Promise.all(
        containerIds.map(async containerId => {
          if (typeof containerId !== "string") {
            return;
          }
          const container = (
            await this.loadModelStratum(
              containerId,
              stratumId,
              allModelStratumData,
              replaceStratum
            )
          ).pushErrorTo(errors, `Failed to load container ${containerId}`);

          if (container) {
            const dereferenced = ReferenceMixin.isMixedInto(container)
              ? container.target
              : container;
            if (GroupMixin.isMixedInto(dereferenced)) {
              (await dereferenced.loadMembers()).pushErrorTo(
                errors,
                `Failed to load group ${dereferenced.uniqueId}`
              );
            }
          }
        })
      );
    }

    // See if model exists by ID of sharekey
    // Change modelId to more up-to-date ID if necessary
    const model = this.getModelByIdOrShareKey(BaseModel, modelId);
    // If no model exists, try to find it through Terria model sharekeys or CatalogIndex sharekeys
    if (isDefined(model?.uniqueId)) {
      modelId = model!.uniqueId;
    } else if (this.catalogIndex) {
      try {
        await this.catalogIndex.load();
      } catch (e) {
        errors.push(
          TerriaError.from(
            e,
            `Failed to load CatalogIndex while loading model stratum \`${modelId}\``
          )
        );
      }
      const indexModel = this.catalogIndex.getModelByIdOrShareKey(modelId);
      if (indexModel) {
        (await indexModel.loadReference()).pushErrorTo(errors);
        modelId = indexModel.uniqueId ?? modelId;
      }
    }

    // If this model is a `SplitItemReference` we must load the source item first
    const splitSourceId = cleanStratumData.splitSourceItemId;
    if (
      cleanStratumData.type === SplitItemReference.type &&
      typeof splitSourceId === "string"
    ) {
      (
        await this.loadModelStratum(
          splitSourceId,
          stratumId,
          allModelStratumData,
          replaceStratum
        )
      ).pushErrorTo(
        errors,
        `Failed to load SplitItemReference ${splitSourceId}`
      );
    }

    const loadedModel = upsertModelFromJson(
      CatalogMemberFactory,
      this,
      "/",
      stratumId,
      {
        ...cleanStratumData,
        id: modelId
      },
      {
        replaceStratum
      }
    ).pushErrorTo(errors);

    if (loadedModel && Array.isArray(containerIds)) {
      containerIds.forEach(containerId => {
        if (
          typeof containerId === "string" &&
          loadedModel.knownContainerUniqueIds.indexOf(containerId) < 0
        ) {
          loadedModel.knownContainerUniqueIds.push(containerId);
        }
      });
    }
    // If we're replacing the stratum and the existing model is already
    // dereferenced, we need to replace the dereferenced stratum, too,
    // even if there's no trace of it in the load data.
    let dereferenced = thisModelStratumData.dereferenced;
    if (
      loadedModel &&
      replaceStratum &&
      dereferenced === undefined &&
      ReferenceMixin.isMixedInto(loadedModel) &&
      loadedModel.target !== undefined
    ) {
      dereferenced = {};
    }
    if (loadedModel && ReferenceMixin.isMixedInto(loadedModel)) {
      (await loadedModel.loadReference()).pushErrorTo(
        errors,
        `Failed to load reference ${loadedModel.uniqueId}`
      );

      if (isDefined(loadedModel.target)) {
        updateModelFromJson(
          loadedModel.target,
          stratumId,
          dereferenced || {},
          replaceStratum
        ).pushErrorTo(
          errors,
          `Failed to update model from JSON: ${loadedModel.target!.uniqueId}`
        );
      }
    } else if (dereferenced) {
      throw new TerriaError({
        sender: this,
        title: "Model cannot be dereferenced",
        message: `Model ${getName(
          loadedModel
        )} has a \`dereferenced\` property, but the model cannot be dereferenced.`
      });
    }

    if (loadedModel) {
      const dereferencedGroup = getDereferencedIfExists(loadedModel);
      if (GroupMixin.isMixedInto(dereferencedGroup)) {
        if (dereferencedGroup.isOpen) {
          (await dereferencedGroup.loadMembers()).pushErrorTo(
            errors,
            `Failed to open group ${dereferencedGroup.uniqueId}`
          );
        }
      }
    }

    return new Result(
      loadedModel,
      TerriaError.combine(errors, {
        // This will set TerriaErrorSeverity to Error if the model which FAILED to load is in the workbench.
        severity: () =>
          this.workbench.items.find(
            workbenchItem => workbenchItem.uniqueId === modelId
          )
            ? TerriaErrorSeverity.Error
            : TerriaErrorSeverity.Warning,
        message: {
          key: "models.terria.loadModelErrorMessage",
          parameters: { model: modelId }
        }
      })
    );
  }

  private async pushAndLoadMapItems(
    model: BaseModel,
    newItems: BaseModel[],
    errors: TerriaError[]
  ) {
    if (ReferenceMixin.isMixedInto(model)) {
      (await model.loadReference()).pushErrorTo(errors);

      if (model.target !== undefined) {
        await this.pushAndLoadMapItems(model.target, newItems, errors);
      } else {
        errors.push(
          TerriaError.from(
            "Reference model has no target. Model Id: " + model.uniqueId
          )
        );
      }
    } else if (GroupMixin.isMixedInto(model)) {
      (await model.loadMembers()).pushErrorTo(errors);

      model.memberModels.map(async m => {
        await this.pushAndLoadMapItems(m, newItems, errors);
      });
    } else if (MappableMixin.isMixedInto(model)) {
      newItems.push(model);
      (await model.loadMapItems()).pushErrorTo(errors);
    } else {
      errors.push(
        TerriaError.from(
          "Can not load an un-mappable item to the map. Item Id: " +
            model.uniqueId
        )
      );
    }
  }

  @action
  async applyInitData({
    initData,
    replaceStratum = false,
    canUnsetFeaturePickingState = false
  }: ApplyInitDataOptions): Promise<void> {
    const errors: TerriaError[] = [];

    initData = toJS(initData);

    const stratumId =
      typeof initData.stratum === "string"
        ? initData.stratum
        : CommonStrata.definition;

    // Extract the list of CORS-ready domains.
    if (Array.isArray(initData.corsDomains)) {
      this.corsProxy.corsDomains.push(...(<string[]>initData.corsDomains));
    }

    if (initData.catalog !== undefined) {
      this.catalog.group
        .addMembersFromJson(stratumId, initData.catalog)
        .pushErrorTo(errors);
    }

    if (isJsonObject(initData.elements)) {
      this.elements.merge(initData.elements);
      // we don't want to go through all elements unless they are added.
      if (this.mapNavigationModel.items.length > 0) {
        this.elements.forEach((element, key) => {
          if (isDefined(element.visible)) {
            if (element.visible) {
              this.mapNavigationModel.show(key);
            } else {
              this.mapNavigationModel.hide(key);
            }
          }
        });
      }
    }

    if (Array.isArray(initData.stories)) {
      this.stories = initData.stories;
    }

    if (isJsonString(initData.viewerMode)) {
      const viewerMode = initData.viewerMode.toLowerCase();
      if (isViewerMode(viewerMode)) setViewerMode(viewerMode, this.mainViewer);
    }

    if (isJsonObject(initData.baseMaps)) {
      this.baseMapsModel
        .loadFromJson(CommonStrata.definition, initData.baseMaps)
        .pushErrorTo(errors);
    }

    if (isJsonObject(initData.homeCamera)) {
      this.loadHomeCamera(initData.homeCamera);
    }

    if (isJsonObject(initData.initialCamera)) {
      const initialCamera = CameraView.fromJson(initData.initialCamera);
      this.currentViewer.zoomTo(initialCamera, 2.0);
    }

    if (isJsonBoolean(initData.showSplitter)) {
      this.showSplitter = initData.showSplitter;
    }

    if (isJsonNumber(initData.splitPosition)) {
      this.splitPosition = initData.splitPosition;
    }

    // Copy but don't yet load the workbench.
    const workbench = Array.isArray(initData.workbench)
      ? initData.workbench.slice()
      : [];

    const timeline = Array.isArray(initData.timeline)
      ? initData.timeline.slice()
      : [];

    // NOTE: after this Promise, this function is no longer an `@action`
    const models = initData.models;
    if (isJsonObject(models)) {
      await Promise.all(
        Object.keys(models).map(async modelId => {
          (
            await this.loadModelStratum(
              modelId,
              stratumId,
              models,
              replaceStratum
            )
          ).pushErrorTo(errors);
        })
      );
    }

    runInAction(() => {
      if (isJsonString(initData.previewedItemId)) {
        this._previewedItemId = initData.previewedItemId;
      }
    });

    // Set the new contents of the workbench.
    const newItemsRaw = filterOutUndefined(
      workbench.map(modelId => {
        if (typeof modelId !== "string") {
          errors.push(
            new TerriaError({
              sender: this,
              title: "Invalid model ID in workbench",
              message: "A model ID in the workbench list is not a string."
            })
          );
        } else {
          return this.getModelByIdOrShareKey(BaseModel, modelId);
        }
      })
    );

    const newItems: BaseModel[] = [];

    // Maintain the model order in the workbench.
    while (true) {
      const model = newItemsRaw.shift();
      if (model) {
        await this.pushAndLoadMapItems(model, newItems, errors);
      } else {
        break;
      }
    }

    runInAction(() => (this.workbench.items = newItems));

    // For ids that don't correspond to models resolve an id by share keys
    const timelineWithShareKeysResolved = new Set(
      filterOutUndefined(
        timeline.map(modelId => {
          if (typeof modelId !== "string") {
            errors.push(
              new TerriaError({
                sender: this,
                title: "Invalid model ID in timeline",
                message: "A model ID in the timneline list is not a string."
              })
            );
          } else {
            if (this.getModelById(BaseModel, modelId) !== undefined) {
              return modelId;
            } else {
              return this.getModelIdByShareKey(modelId);
            }
          }
        })
      )
    );

    // TODO: the timelineStack should be populated from the `timeline` property,
    // not from the workbench.
    runInAction(
      () =>
        (this.timelineStack.items = this.workbench.items
          .filter(item => {
            return (
              item.uniqueId && timelineWithShareKeysResolved.has(item.uniqueId)
            );
            // && TODO: what is a good way to test if an item is of type TimeVarying.
          })
          .map(item => <TimeVarying>item))
    );

    if (isJsonObject(initData.pickedFeatures)) {
      when(() => !(this.currentViewer instanceof NoViewer)).then(() => {
        if (isJsonObject(initData.pickedFeatures)) {
          this.loadPickedFeatures(initData.pickedFeatures);
        }
      });
    } else if (canUnsetFeaturePickingState) {
      runInAction(() => {
        this.pickedFeatures = undefined;
        this.selectedFeature = undefined;
      });
    }

    if (errors.length > 0)
      throw TerriaError.combine(errors, {
        message: {
          key: "models.terria.loadingInitSourceErrorTitle"
        }
      });
  }

  @action
  loadHomeCamera(homeCameraInit: JsonObject | HomeCameraInit) {
    this.mainViewer.homeCamera = CameraView.fromJson(homeCameraInit);
  }

  /**
   * This method can be used to refresh magda based catalogue configuration. Useful if the catalogue
   * has items that are only available to authorised users.
   *
   * @param magdaCatalogConfigUrl URL of magda based catalogue configuration
   * @param config Optional. If present, use this magda based catalogue config instead of reloading.
   * @param configUrlHeaders  Optional. If present, the headers are added to above URL request.
   */
  async refreshCatalogMembersFromMagda(
    magdaCatalogConfigUrl: string,
    config?: any,
    configUrlHeaders?: { [key: string]: string }
  ) {
    const theConfig = config
      ? config
      : await loadJson5(magdaCatalogConfigUrl, configUrlHeaders);

    // force config (root group) id to be `/`
    const id = "/";
    this.removeModelReferences(this.catalog.group);

    let existingReference = this.getModelById(MagdaReference, id);
    if (existingReference === undefined) {
      existingReference = new MagdaReference(id, this);
      // Add model with terria aspects shareKeys
      this.addModel(existingReference, theConfig.aspects?.terria?.shareKeys);
    }

    const reference = existingReference;

    const magdaRoot = new URI(magdaCatalogConfigUrl)
      .path("")
      .query("")
      .toString();

    reference.setTrait(CommonStrata.definition, "url", magdaRoot);
    reference.setTrait(CommonStrata.definition, "recordId", id);
    reference.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      theConfig as JsonObject
    );
    (await reference.loadReference(true)).raiseError(
      this,
      `Failed to load MagdaReference for record ${id}`
    );
    if (reference.target instanceof CatalogGroup) {
      runInAction(() => {
        this.catalog.group = <CatalogGroup>reference.target;
      });
    }
  }

  async loadMagdaConfig(configUrl: string, config: any, baseUri: uri.URI) {
    const aspects = config.aspects;
    const configParams = aspects["terria-config"]?.parameters;

    if (configParams) {
      this.updateParameters(configParams);
    }

    const initObj = aspects["terria-init"];
    if (isJsonObject(initObj)) {
      const { catalog, ...initObjWithoutCatalog } = initObj;
      /** Load the init data without the catalog yet, as we'll push the catalog
       * source up as an init source later */
      try {
        await this.applyInitData({
          initData: initObjWithoutCatalog
        });
      } catch (e) {
        this.raiseErrorToUser(e, {
          title: { key: "models.terria.loadingMagdaInitSourceErrorMessage" },
          message: {
            key: "models.terria.loadingMagdaInitSourceErrorMessage",
            parameters: { url: configUrl }
          }
        });
      }
    }

    if (aspects.group && aspects.group.members) {
      await this.refreshCatalogMembersFromMagda(configUrl, config);
    }

    this.setupInitializationUrls(baseUri, config.aspects?.["terria-config"]);
    /** Load up rest of terria catalog if one is inlined in terria-init */
    if (config.aspects?.["terria-init"]) {
      const { catalog, ...rest } = initObj;
      this.initSources.push({
        name: `Magda map-config aspect terria-init from ${configUrl}`,
        errorSeverity: TerriaErrorSeverity.Error,
        data: {
          catalog: catalog
        }
      });
    }
  }

  @action
  async loadPickedFeatures(pickedFeatures: JsonObject): Promise<void> {
    let vectorFeatures: Entity[] = [];
    let featureIndex: Record<number, Entity[] | undefined> = {};

    if (Array.isArray(pickedFeatures.entities)) {
      // Build index of terria features by a hash of their properties.
      const relevantItems = this.workbench.items.filter(
        item =>
          hasTraits(item, MappableTraits, "show") &&
          item.show &&
          MappableMixin.isMixedInto(item)
      ) as MappableMixin.Instance[];

      relevantItems.forEach(item => {
        const entities: Entity[] = item.mapItems
          .filter(isDataSource)
          .reduce((arr: Entity[], ds) => arr.concat(ds.entities.values), []);

        entities.forEach(entity => {
          const hash = hashEntity(entity, this.timelineClock);
          const feature = Feature.fromEntityCollectionOrEntity(entity);
          featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
        });
      });

      // Go through the features we've got from terria match them up to the id/name info we got from the
      // share link, filtering out any without a match.
      vectorFeatures = filterOutUndefined(
        pickedFeatures.entities.map(e => {
          if (isJsonObject(e) && typeof e.hash === "number") {
            const features = featureIndex[e.hash] || [];
            const match = features.find(f => f.name === e.name);
            return match;
          }
        })
      );
    }

    // Set the current pick location, if we have a valid coord
    const maybeCoords: any = pickedFeatures.pickCoords;
    const pickCoords = {
      latitude: maybeCoords?.lat,
      longitude: maybeCoords?.lng,
      height: maybeCoords?.height
    };
    if (
      isLatLonHeight(pickCoords) &&
      isProviderCoordsMap(pickedFeatures.providerCoords)
    ) {
      this.currentViewer.pickFromLocation(
        pickCoords,
        pickedFeatures.providerCoords,
        vectorFeatures as Feature[]
      );
    }

    if (this.pickedFeatures?.allFeaturesAvailablePromise) {
      // When feature picking is done, set the selected feature
      await this.pickedFeatures?.allFeaturesAvailablePromise;
    }

    runInAction(() => {
      this.pickedFeatures?.features.forEach((entity: Entity) => {
        const hash = hashEntity(entity, this.timelineClock);
        const feature = entity;
        featureIndex[hash] = (featureIndex[hash] || []).concat([feature]);
      });

      const current = pickedFeatures.current;
      if (
        isJsonObject(current) &&
        typeof current.hash === "number" &&
        typeof current.name === "string"
      ) {
        const selectedFeature = (featureIndex[current.hash] || []).find(
          feature => feature.name === current.name
        );
        if (selectedFeature) {
          this.selectedFeature = selectedFeature as Feature;
        }
      }
    });
  }

  async initCorsProxy(config: ConfigParameters, serverConfig: any) {
    if (config.proxyableDomainsUrl) {
      console.warn(i18next.t("models.terria.proxyableDomainsDeprecation"));
    }
    this.corsProxy.init(
      serverConfig,
      this.configParameters.corsProxyBaseUrl,
      []
    );
  }

  getUserProperty(key: string) {
    return undefined;
  }

  getLocalProperty(key: string): string | boolean | null {
    try {
      if (!defined(window.localStorage)) {
        return null;
      }
    } catch (e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return null;
    }
    var v = window.localStorage.getItem(this.appName + "." + key);
    if (v === "true") {
      return true;
    } else if (v === "false") {
      return false;
    }
    return v;
  }

  setLocalProperty(key: string, value: string | boolean): boolean {
    try {
      if (!defined(window.localStorage)) {
        return false;
      }
    } catch (e) {
      return false;
    }
    window.localStorage.setItem(this.appName + "." + key, value.toString());
    return true;
  }
}

function generateInitializationUrl(
  baseUri: uri.URI,
  initFragmentPaths: string[],
  url: string
): InitSource {
  if (url.toLowerCase().substring(url.length - 5) !== ".json") {
    return {
      options: initFragmentPaths.map(fragmentPath => {
        return {
          initUrl: URI.joinPaths(fragmentPath, url + ".json")
            .absoluteTo(baseUri)
            .toString()
        };
      })
    };
  }
  return {
    initUrl: new URI(url).absoluteTo(baseUri).toString()
  };
}

async function interpretHash(
  terria: Terria,
  hashProperties: any,
  userProperties: Map<string, any>,
  baseUri: uri.URI
) {
  if (isDefined(hashProperties.clean)) {
    runInAction(() => {
      terria.initSources.splice(0, terria.initSources.length);
    });
  }

  runInAction(() => {
    Object.keys(hashProperties).forEach(function(property) {
      if (["clean", "hideWelcomeMessage", "start", "share"].includes(property))
        return;
      const propertyValue = hashProperties[property];
      if (defined(propertyValue) && propertyValue.length > 0) {
        userProperties.set(property, propertyValue);
      } else {
        const initSourceFile = generateInitializationUrl(
          baseUri,
          terria.configParameters.initFragmentPaths,
          property
        );
        terria.initSources.push({
          name: `InitUrl from applicationURL hash ${property}`,
          errorSeverity: TerriaErrorSeverity.Error,
          ...initSourceFile
        });
      }
    });
  });

  if (isDefined(hashProperties.hideWelcomeMessage)) {
    terria.configParameters.showWelcomeMessage = false;
  }

  // a share link that hasn't been shortened: JSON embedded in URL (only works for small quantities of JSON)
  if (isDefined(hashProperties.start)) {
    try {
      const startData = JSON.parse(hashProperties.start);
      await interpretStartData(
        terria,
        startData,
        'Start data from hash `"#start"` value',
        TerriaErrorSeverity.Error,
        false // Hide conversion warning message - as we assume that people using #start are embedding terria.
      );
    } catch (e) {
      throw TerriaError.from(e, {
        message: { key: "models.terria.parsingStartDataErrorMessage" },
        importance: -1
      });
    }
  }

  // Resolve #share=xyz with the share data service.
  if (
    hashProperties.share !== undefined &&
    terria.shareDataService !== undefined
  ) {
    const shareProps = await terria.shareDataService.resolveData(
      hashProperties.share
    );

    if (shareProps) {
      await interpretStartData(
        terria,
        shareProps,
        `Start data from sharelink \`"${hashProperties.share}"\``
      );
    }
  }
}

async function interpretStartData(
  terria: Terria,
  startData: unknown,
  /** Name for startData initSources - this is only used for debugging purposes */
  name: string,
  /** Error severity to use for loading startData init sources - if not set, TerriaError will be propagated normally */
  errorSeverity?: TerriaErrorSeverity,
  showConversionWarning = true
) {
  const containsStory = (initSource: any) =>
    Array.isArray(initSource.stories) && initSource.stories.length;
  if (isJsonObject(startData)) {
    // Convert startData to v8 if neccessary
    let startDataV8: Share | null;

    try {
      if (
        // If startData.version has version 0.x.x - user catalog-converter to convert startData
        "version" in startData &&
        typeof startData.version === "string" &&
        startData.version.startsWith("0")
      ) {
        const { convertShare } = await import("catalog-converter");
        const result = convertShare(startData);

        // Show warning messages if converted
        if (result.converted && showConversionWarning) {
          terria.notificationState.addNotificationToQueue({
            title: i18next.t("share.convertNotificationTitle"),
            message: shareConvertNotification(result.messages)
          });
        }
        startDataV8 = result.result;
      } else {
        startDataV8 = {
          ...startData,
          version: isJsonString(startData.version)
            ? startData.version
            : SHARE_VERSION,
          initSources: isJsonArray(startData.initSources)
            ? startData.initSources
            : []
        };
      }

      if (startDataV8 !== null && Array.isArray(startDataV8.initSources)) {
        runInAction(() => {
          terria.initSources.push(
            ...startDataV8!.initSources.map((initSource: any) => {
              return {
                name,
                data: initSource,
                errorSeverity
              };
            })
          );
        });
        if (startDataV8.initSources.some(containsStory)) {
          terria.configParameters.showWelcomeMessage = false;
        }
      }
    } catch (error) {
      throw TerriaError.from(error, {
        title: { key: "share.convertErrorTitle" },
        message: { key: "share.convertErrorMessage" }
      });
    }
  }
}

function setCustomRequestSchedulerDomainLimits(
  customDomainLimits: ConfigParameters["customRequestSchedulerLimits"]
) {
  if (isDefined(customDomainLimits)) {
    Object.entries(customDomainLimits).forEach(([domain, limit]) => {
      RequestScheduler.requestsByServer[domain] = limit;
    });
  }
}
