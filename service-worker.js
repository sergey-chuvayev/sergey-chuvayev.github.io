"use strict";var precacheConfig=[["/index.html","dc13b580d19c52ad5a38f56ff16cd123"],["/static/css/main.5b1a15da.css","72e8386627189a7a633f5e4ff2989fb2"],["/static/js/main.ebd20d6a.js","32cc3828a8231a0ffb8c8b03127511a5"],["/static/media/helvetica-neue-lt-bold.417e7d97.woff","417e7d97a85ffdf8f3efb8582824fc61"],["/static/media/helvetica-neue-lt-bold.9ac7e2ff.otf","9ac7e2ff6b9792291e65269b982efa35"],["/static/media/helvetica-neue-lt-bold.f16f6414.eot","f16f64141770a8bf966b2d5526dd89ac"],["/static/media/helvetica-neue-lt-light.06137036.otf","06137036ee2d59941c9bda383866b943"],["/static/media/helvetica-neue-lt-light.4ddbadcb.woff","4ddbadcb6b12bda5bd18deacf97f7671"],["/static/media/helvetica-neue-lt-light.f373868c.eot","f373868c769f0f5c2c41d959ccbc0bf8"],["/static/media/helvetica-neue-lt-thin.957c7a8c.otf","957c7a8c1737c7b0c1325818e20d08dc"],["/static/media/helvetica-neue-lt-thin.aac7c0fc.eot","aac7c0fcf59154a82f5d52c5c5ee89cb"],["/static/media/helvetica-neue-lt-thin.f25d4f0e.woff","f25d4f0e7ffd0e1c15de7550dc748e3f"],["/static/media/sergey.bd656cac.png","bd656cacd719b9ea7f2c0ea6feda0ce4"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,t){var n=new URL(e);return"/"===n.pathname.slice(-1)&&(n.pathname+=t),n.toString()},cleanResponse=function(t){return t.redirected?("body"in t?Promise.resolve(t.body):t.blob()).then(function(e){return new Response(e,{headers:t.headers,status:t.status,statusText:t.statusText})}):Promise.resolve(t)},createCacheKey=function(e,t,n,a){var c=new URL(e);return a&&c.pathname.match(a)||(c.search+=(c.search?"&":"")+encodeURIComponent(t)+"="+encodeURIComponent(n)),c.toString()},isPathWhitelisted=function(e,t){if(0===e.length)return!0;var n=new URL(t).pathname;return e.some(function(e){return n.match(e)})},stripIgnoredUrlParameters=function(e,n){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(t){return n.every(function(e){return!e.test(t[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var t=e[0],n=e[1],a=new URL(t,self.location),c=createCacheKey(a,hashParamName,n,/\.\w{8}\./);return[a.toString(),c]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(a){return setOfCachedUrls(a).then(function(n){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!n.has(t)){var e=new Request(t,{credentials:"same-origin"});return fetch(e).then(function(e){if(!e.ok)throw new Error("Request for "+t+" returned a response with status "+e.status);return cleanResponse(e).then(function(e){return a.put(t,e)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var n=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(t){return t.keys().then(function(e){return Promise.all(e.map(function(e){if(!n.has(e.url))return t.delete(e)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(t){if("GET"===t.request.method){var e,n=stripIgnoredUrlParameters(t.request.url,ignoreUrlParametersMatching),a="index.html";(e=urlsToCacheKeys.has(n))||(n=addDirectoryIndex(n,a),e=urlsToCacheKeys.has(n));var c="/index.html";!e&&"navigate"===t.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],t.request.url)&&(n=new URL(c,self.location).toString(),e=urlsToCacheKeys.has(n)),e&&t.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(n)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(e){return console.warn('Couldn\'t serve response for "%s" from cache: %O',t.request.url,e),fetch(t.request)}))}});