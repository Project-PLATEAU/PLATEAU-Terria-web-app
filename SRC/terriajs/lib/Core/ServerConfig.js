"use strict";

const i18next = require("i18next").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var loadJson = require("./loadJson").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var DEFAULT_URL = "serverconfig/";
/**
 * Provides information about the configuration of the Terria server, by querying /serverconfig
 */
function ServerConfig() {
  /**
   * Contains configuration information retrieved from the server. The attributes are defined by TerriaJS-Server but include:
   *   version: current version of server
   *   proxyAllDomains: whether all domains can be proxied
   *   allowProxyFrom: array of domains that can be proxied
   *   maxConversionSize: maximum size, in bytes, of files that can be uploaded to conversion service
   *   newShareUrlPrefix: if defined, the share URL service is active
   *   shareUrlPrefixes: object defining share URL prefixes that can be resolved
   *   additionalFeedbackParameters: array of additional feedback parameters that can be used
   * @type {Object}
   */
  this.config = undefined;
}
/**
 * Initialises the object by fetching the configuration from the server. Note that if the request to get config from the proxy server fails, an error
 * is logged and nothing else happens. If you want to do something more like display a warning to the user, you'll have
 * to .otherwise the promise returned from the method.
 * @param  {String} serverConfigUrl Optional override URL.
 * @return {Object} Promise that resolves to the configuration object itself.
 */
ServerConfig.prototype.init = function(serverConfigUrl) {
  if (this.config !== undefined) {
    return when(this.config);
  }
  this.serverConfigUrl = defaultValue(serverConfigUrl, DEFAULT_URL);
  var that = this;
  return loadJson(this.serverConfigUrl)
    .then(function(config) {
      that.config = config;
      return that.config;
    })
    .catch(function(e) {
      console.error(
        i18next.t("core.serverConfig.failedToGet", {
          serverConfigUrl: that.serverConfigUrl
        })
      );
    });
};

module.exports = ServerConfig;
