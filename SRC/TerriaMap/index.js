'use strict';

var terriaOptions = {
    baseUrl: 'build/TerriaJS'
};

import { runInAction, autorun } from "mobx";

// checkBrowserCompatibility('ui');
import ConsoleAnalytics from 'terriajs/lib/Core/ConsoleAnalytics';
import GoogleAnalytics from 'terriajs/lib/Core/GoogleAnalytics';
import ShareDataService from 'terriajs/lib/Models/ShareDataService';
// import registerAnalytics from 'terriajs/lib/Models/registerAnalytics';
// import registerCatalogMembers from 'terriajs/lib/Models/registerCatalogMembers';
import registerCustomComponentTypes from 'terriajs/lib/ReactViews/Custom/registerCustomComponentTypes';
import Terria from 'terriajs/lib/Models/Terria';
import updateApplicationOnHashChange from 'terriajs/lib/ViewModels/updateApplicationOnHashChange';
import updateApplicationOnMessageFromParentWindow from 'terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow';
import ViewState from 'terriajs/lib/ReactViewModels/ViewState';
import BingMapsSearchProviderViewModel from 'terriajs/lib/Models/SearchProviders/BingMapsSearchProvider';
// import GazetteerSearchProviderViewModel from 'terriajs/lib/ViewModels/GazetteerSearchProviderViewModel.js';
// import GnafSearchProviderViewModel from 'terriajs/lib/ViewModels/GnafSearchProviderViewModel.js';
// import defined from 'terriajs-cesium/Source/Core/defined';
import render from './lib/Views/render';
import registerCatalogMembers from 'terriajs/lib/Models/Catalog/registerCatalogMembers';
import defined from 'terriajs-cesium/Source/Core/defined';

import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import {setLight, switchTerrain, getVrInfoFromCamera, determineCatalogItem} from 'terriajs/lib/ViewModels/cesiumFunctions';
import {getVrUrlRoot} from 'terriajs/lib/ViewModels/workbenchFuncitons';


let assetId;

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
// registerCatalogMembers();
// registerAnalytics();

// we check exact match for development to reduce chances that production flag isn't set on builds(?)
if (process.env.NODE_ENV === "development") {
    terriaOptions.analytics = new ConsoleAnalytics();
} else {
    terriaOptions.analytics = new GoogleAnalytics();
}

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

// Register custom components in the core TerriaJS.  If you only want to register a subset of them, or to add your own,
// insert your custom version of the code in the registerCustomComponentTypes function here instead.
registerCustomComponentTypes(terria);

// Create the ViewState before terria.start so that errors have somewhere to go.
const viewState = new ViewState({
    terria: terria
});

registerCatalogMembers();

if (process.env.NODE_ENV === "development") {
    window.viewState = viewState;
}

// If we're running in dev mode, disable the built style sheet as we'll be using the webpack style loader.
// Note that if the first stylesheet stops being nationalmap.css then this will have to change.
if (process.env.NODE_ENV !== "production" && module.hot) {
    document.styleSheets[0].disabled = true;
}

module.exports = terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    shareDataService: new ShareDataService({
        terria: terria
    })
}).catch(function(e) {
  terria.raiseErrorToUser(e);
}).finally(function() {
    terria.loadInitSources().then(result => result.raiseError(terria));
    try {
        viewState.searchState.locationSearchProviders = [
            new BingMapsSearchProviderViewModel({
                terria: terria,
                key: terria.configParameters.bingMapsKey
            }),
            // new GazetteerSearchProviderViewModel({terria}),
            // new GnafSearchProviderViewModel({terria})
        ];

        // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
        updateApplicationOnHashChange(terria, window);
        updateApplicationOnMessageFromParentWindow(terria, window);

        // Show a modal disclaimer before user can do anything else.
        if (defined(terria.configParameters.globalDisclaimer)) {
            var globalDisclaimer = terria.configParameters.globalDisclaimer;
            var hostname = window.location.hostname;
            if (globalDisclaimer.enableOnLocalhost || hostname.indexOf('localhost') === -1) {
                var message = '';
                // Sometimes we want to show a preamble if the user is viewing a site other than the official production instance.
                // This can be expressed as a devHostRegex ("any site starting with staging.") or a negative prodHostRegex ("any site not ending in .gov.au")
                if (defined(globalDisclaimer.devHostRegex) && hostname.match(globalDisclaimer.devHostRegex) ||
                    defined(globalDisclaimer.prodHostRegex) && !hostname.match(globalDisclaimer.prodHostRegex)) {
                        message += require('./lib/Views/DevelopmentDisclaimerPreamble.html');
                }
                message += require('./lib/Views/GlobalDisclaimer.html');

                var options = {
                    title: (globalDisclaimer.title !== undefined) ? globalDisclaimer.title : 'Warning',
                    confirmText: (globalDisclaimer.buttonTitle || "Ok"),
                    denyText: (globalDisclaimer.denyText || "Cancel"),
                    // denyAction: globalDisclaimer.afterDenyLocation ? function() {
                    //     window.location = globalDisclaimer.afterDenyLocation;
                    // } : undefined,
                    denyAction: function() {
                        window.location = globalDisclaimer.afterDenyLocation || "https://terria.io/";
                    },
                    width: 600,
                    height: 550,
                    message: message,
                    horizontalPadding : 100
                };
                runInAction(() => {
                    viewState.disclaimerSettings = options;
                    viewState.disclaimerVisible = true;
                });
            }
        }

        autorun(()=>{
            if (terria.currentViewer.type === "Cesium"){
                // 太陽固定
                setLight(terria);

                const camera = terria.currentViewer.scene.camera;
                camera.moveEnd.addEventListener(()=>{
                    // 位置によるアセットID変更
                    assetId = switchTerrain(terria, assetId);

                    // // 半径 n kmないのデータのみ表示（実験的機能）
                    // runInAction(()=>{
                    //     for (const disposer of disposers){
                    //         disposer();
                    //     }
                    //     disposers = [];
                    //     for (const item of terria.workbench.items){
                    //         if (! item.customProperties || ! item.customProperties.filterByDistance){
                    //             continue;
                    //         }
                    //         disposers.push(showFeaturesInRange(item, camera));
                    //     }    
                    // });                
                });

                // Panasonic VR マーカー
                const inputHandler = terria.currentViewer.cesiumWidget.screenSpaceEventHandler;
                const defaultHandler = inputHandler.getInputAction(ScreenSpaceEventType.LEFT_CLICK);

                inputHandler.setInputAction(e => {
                    defaultHandler(e);

                    // const cameraView = terria.currentViewer.getCurrentCameraView();
                    const vrInfo = getVrInfoFromCamera(terria.currentViewer.scene.camera);

                    // TODO: This is bad. How can we do it better?
                    setTimeout(()=>{
                        for (const f of terria.pickedFeatures.features){
                            const workbenchItem = determineCatalogItem(terria.workbench, f);
                            let vrUrlRoot = getVrUrlRoot(workbenchItem);
                            if (vrUrlRoot){
                                vrUrlRoot = vrUrlRoot.replace(/"/g, "");
                                const vrUrl = `${vrUrlRoot}?latitude=${vrInfo.lat}&longitude=${vrInfo.lng}&altitude=${vrInfo.height}&heading=${vrInfo.heading}&pitch=${vrInfo.pitch}&id=${f.id}`;
                                
                                window.open(vrUrl, "panasonic_vr");
                                break;
                            }
                        }

                    },100);
                    
                }, ScreenSpaceEventType.LEFT_CLICK);
                

            }
        });

        // Add font-imports
        const fontImports = terria.configParameters.theme?.fontImports;
        if (fontImports) {
          const styleSheet = document.createElement("style");
          styleSheet.type = "text/css";
          styleSheet.innerText = fontImports;
          document.head.appendChild(styleSheet);
        }

        render(terria, [], viewState);
    } catch (e) {
        console.error(e);
        console.error(e.stack);
    }
});
