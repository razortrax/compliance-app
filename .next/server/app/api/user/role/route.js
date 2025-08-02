"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/user/role/route";
exports.ids = ["app/api/user/role/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fuser%2Frole%2Froute&page=%2Fapi%2Fuser%2Frole%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fuser%2Frole%2Froute.ts&appDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fuser%2Frole%2Froute&page=%2Fapi%2Fuser%2Frole%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fuser%2Frole%2Froute.ts&appDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_patrick_Documents_Development_compliance_app_src_app_api_user_role_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/user/role/route.ts */ \"(rsc)/./src/app/api/user/role/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/user/role/route\",\n        pathname: \"/api/user/role\",\n        filename: \"route\",\n        bundlePath: \"app/api/user/role/route\"\n    },\n    resolvedPagePath: \"/Users/patrick/Documents/Development/compliance_app/src/app/api/user/role/route.ts\",\n    nextConfigOutput,\n    userland: _Users_patrick_Documents_Development_compliance_app_src_app_api_user_role_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/user/role/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZ1c2VyJTJGcm9sZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGdXNlciUyRnJvbGUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZ1c2VyJTJGcm9sZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRnBhdHJpY2slMkZEb2N1bWVudHMlMkZEZXZlbG9wbWVudCUyRmNvbXBsaWFuY2VfYXBwJTJGc3JjJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnBhdHJpY2slMkZEb2N1bWVudHMlMkZEZXZlbG9wbWVudCUyRmNvbXBsaWFuY2VfYXBwJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUNrQztBQUMvRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL2NvbXBsaWFuY2UtYXBwLXRlbXAvPzFjOWQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL3BhdHJpY2svRG9jdW1lbnRzL0RldmVsb3BtZW50L2NvbXBsaWFuY2VfYXBwL3NyYy9hcHAvYXBpL3VzZXIvcm9sZS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvdXNlci9yb2xlL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvdXNlci9yb2xlXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS91c2VyL3JvbGUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvcGF0cmljay9Eb2N1bWVudHMvRGV2ZWxvcG1lbnQvY29tcGxpYW5jZV9hcHAvc3JjL2FwcC9hcGkvdXNlci9yb2xlL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS91c2VyL3JvbGUvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fuser%2Frole%2Froute&page=%2Fapi%2Fuser%2Frole%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fuser%2Frole%2Froute.ts&appDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/user/role/route.ts":
/*!****************************************!*\
  !*** ./src/app/api/user/role/route.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _clerk_nextjs_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @clerk/nextjs/server */ \"(rsc)/./node_modules/@clerk/nextjs/dist/esm/app-router/server/auth.js\");\n/* harmony import */ var _db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/db */ \"(rsc)/./src/db/index.ts\");\n\n\n\nasync function GET() {\n    const { userId } = await (0,_clerk_nextjs_server__WEBPACK_IMPORTED_MODULE_2__.auth)();\n    if (!userId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    try {\n        // First check if user is a consultant\n        const consultantRole = await _db__WEBPACK_IMPORTED_MODULE_1__.db.role.findFirst({\n            where: {\n                party: {\n                    userId: userId,\n                    consultant: {\n                        isNot: null\n                    }\n                },\n                roleType: \"consultant\",\n                isActive: true\n            },\n            include: {\n                party: {\n                    include: {\n                        consultant: true\n                    }\n                }\n            }\n        });\n        if (consultantRole) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                role: {\n                    roleType: \"consultant\",\n                    organizationId: null\n                }\n            });\n        }\n        // Check for other roles (master, organization, location) for this user\n        const userRole = await _db__WEBPACK_IMPORTED_MODULE_1__.db.role.findFirst({\n            where: {\n                party: {\n                    userId: userId // Filter by current user\n                },\n                isActive: true,\n                roleType: {\n                    in: [\n                        \"master\",\n                        \"organization\",\n                        \"location\",\n                        \"admin\",\n                        \"manager\"\n                    ]\n                }\n            },\n            orderBy: {\n                startDate: \"desc\"\n            }\n        });\n        if (userRole) {\n            // Map role types to management levels\n            let managementLevel = userRole.roleType;\n            if (userRole.roleType === \"admin\" || userRole.roleType === \"manager\") {\n                // Determine if they're organization or location level based on context\n                if (userRole.organizationId) {\n                    managementLevel = \"organization\";\n                } else {\n                    managementLevel = \"master\";\n                }\n            }\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                role: {\n                    roleType: managementLevel,\n                    organizationId: userRole.organizationId\n                }\n            });\n        }\n        // No role found for this user - they need to complete their profile\n        // Check if they have a party record\n        const userParty = await _db__WEBPACK_IMPORTED_MODULE_1__.db.party.findFirst({\n            where: {\n                userId: userId\n            }\n        });\n        if (!userParty) {\n            // User has no party record yet - they need to complete their profile\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                role: {\n                    roleType: \"new_user\",\n                    organizationId: null\n                }\n            });\n        }\n        // Default to organization level for existing users without roles\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            role: {\n                roleType: \"organization\",\n                organizationId: null\n            }\n        });\n    } catch (error) {\n        console.error(\"Error fetching user role:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to fetch user role\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS91c2VyL3JvbGUvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUEwQztBQUNDO0FBQ2xCO0FBRWxCLGVBQWVHO0lBQ3BCLE1BQU0sRUFBRUMsTUFBTSxFQUFFLEdBQUcsTUFBTUgsMERBQUlBO0lBRTdCLElBQUksQ0FBQ0csUUFBUTtRQUNYLE9BQU9KLHFEQUFZQSxDQUFDSyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFlLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3BFO0lBRUEsSUFBSTtRQUNGLHNDQUFzQztRQUN0QyxNQUFNQyxpQkFBaUIsTUFBTU4sbUNBQUVBLENBQUNPLElBQUksQ0FBQ0MsU0FBUyxDQUFDO1lBQzdDQyxPQUFPO2dCQUNMQyxPQUFPO29CQUNMUixRQUFRQTtvQkFDUlMsWUFBWTt3QkFDVkMsT0FBTztvQkFDVDtnQkFDRjtnQkFDQUMsVUFBVTtnQkFDVkMsVUFBVTtZQUNaO1lBQ0FDLFNBQVM7Z0JBQ1BMLE9BQU87b0JBQ0xLLFNBQVM7d0JBQ1BKLFlBQVk7b0JBQ2Q7Z0JBQ0Y7WUFDRjtRQUNGO1FBRUEsSUFBSUwsZ0JBQWdCO1lBQ2xCLE9BQU9SLHFEQUFZQSxDQUFDSyxJQUFJLENBQUM7Z0JBQ3ZCSSxNQUFNO29CQUNKTSxVQUFVO29CQUNWRyxnQkFBZ0I7Z0JBQ2xCO1lBQ0Y7UUFDRjtRQUVBLHVFQUF1RTtRQUN2RSxNQUFNQyxXQUFXLE1BQU1qQixtQ0FBRUEsQ0FBQ08sSUFBSSxDQUFDQyxTQUFTLENBQUM7WUFDdkNDLE9BQU87Z0JBQ0xDLE9BQU87b0JBQ0xSLFFBQVFBLE9BQU8seUJBQXlCO2dCQUMxQztnQkFDQVksVUFBVTtnQkFDVkQsVUFBVTtvQkFDUkssSUFBSTt3QkFBQzt3QkFBVTt3QkFBZ0I7d0JBQVk7d0JBQVM7cUJBQVU7Z0JBQ2hFO1lBQ0Y7WUFDQUMsU0FBUztnQkFDUEMsV0FBVztZQUNiO1FBQ0Y7UUFFQSxJQUFJSCxVQUFVO1lBQ1osc0NBQXNDO1lBQ3RDLElBQUlJLGtCQUFrQkosU0FBU0osUUFBUTtZQUN2QyxJQUFJSSxTQUFTSixRQUFRLEtBQUssV0FBV0ksU0FBU0osUUFBUSxLQUFLLFdBQVc7Z0JBQ3BFLHVFQUF1RTtnQkFDdkUsSUFBSUksU0FBU0QsY0FBYyxFQUFFO29CQUMzQkssa0JBQWtCO2dCQUNwQixPQUFPO29CQUNMQSxrQkFBa0I7Z0JBQ3BCO1lBQ0Y7WUFFQSxPQUFPdkIscURBQVlBLENBQUNLLElBQUksQ0FBQztnQkFDdkJJLE1BQU07b0JBQ0pNLFVBQVVRO29CQUNWTCxnQkFBZ0JDLFNBQVNELGNBQWM7Z0JBQ3pDO1lBQ0Y7UUFDRjtRQUVBLG9FQUFvRTtRQUNwRSxvQ0FBb0M7UUFDcEMsTUFBTU0sWUFBWSxNQUFNdEIsbUNBQUVBLENBQUNVLEtBQUssQ0FBQ0YsU0FBUyxDQUFDO1lBQ3pDQyxPQUFPO2dCQUFFUCxRQUFRQTtZQUFPO1FBQzFCO1FBRUEsSUFBSSxDQUFDb0IsV0FBVztZQUNkLHFFQUFxRTtZQUNyRSxPQUFPeEIscURBQVlBLENBQUNLLElBQUksQ0FBQztnQkFDdkJJLE1BQU07b0JBQ0pNLFVBQVU7b0JBQ1ZHLGdCQUFnQjtnQkFDbEI7WUFDRjtRQUNGO1FBRUEsaUVBQWlFO1FBQ2pFLE9BQU9sQixxREFBWUEsQ0FBQ0ssSUFBSSxDQUFDO1lBQ3ZCSSxNQUFNO2dCQUNKTSxVQUFVO2dCQUNWRyxnQkFBZ0I7WUFDbEI7UUFDRjtJQUVGLEVBQUUsT0FBT1osT0FBTztRQUNkbUIsUUFBUW5CLEtBQUssQ0FBQyw2QkFBNkJBO1FBQzNDLE9BQU9OLHFEQUFZQSxDQUFDSyxJQUFJLENBQUM7WUFDdkJDLE9BQU87UUFDVCxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNuQjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY29tcGxpYW5jZS1hcHAtdGVtcC8uL3NyYy9hcHAvYXBpL3VzZXIvcm9sZS9yb3V0ZS50cz9iMDUzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJ1xuaW1wb3J0IHsgYXV0aCB9IGZyb20gJ0BjbGVyay9uZXh0anMvc2VydmVyJ1xuaW1wb3J0IHsgZGIgfSBmcm9tICdAL2RiJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKCkge1xuICBjb25zdCB7IHVzZXJJZCB9ID0gYXdhaXQgYXV0aCgpXG5cbiAgaWYgKCF1c2VySWQpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1VuYXV0aG9yaXplZCcgfSwgeyBzdGF0dXM6IDQwMSB9KVxuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBGaXJzdCBjaGVjayBpZiB1c2VyIGlzIGEgY29uc3VsdGFudFxuICAgIGNvbnN0IGNvbnN1bHRhbnRSb2xlID0gYXdhaXQgZGIucm9sZS5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgcGFydHk6IHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXJJZCwgLy8gRmlsdGVyIGJ5IGN1cnJlbnQgdXNlclxuICAgICAgICAgIGNvbnN1bHRhbnQ6IHtcbiAgICAgICAgICAgIGlzTm90OiBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByb2xlVHlwZTogJ2NvbnN1bHRhbnQnLFxuICAgICAgICBpc0FjdGl2ZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgcGFydHk6IHtcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICBjb25zdWx0YW50OiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmIChjb25zdWx0YW50Um9sZSkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcbiAgICAgICAgcm9sZToge1xuICAgICAgICAgIHJvbGVUeXBlOiAnY29uc3VsdGFudCcsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3Igb3RoZXIgcm9sZXMgKG1hc3Rlciwgb3JnYW5pemF0aW9uLCBsb2NhdGlvbikgZm9yIHRoaXMgdXNlclxuICAgIGNvbnN0IHVzZXJSb2xlID0gYXdhaXQgZGIucm9sZS5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgcGFydHk6IHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXJJZCAvLyBGaWx0ZXIgYnkgY3VycmVudCB1c2VyXG4gICAgICAgIH0sXG4gICAgICAgIGlzQWN0aXZlOiB0cnVlLFxuICAgICAgICByb2xlVHlwZToge1xuICAgICAgICAgIGluOiBbJ21hc3RlcicsICdvcmdhbml6YXRpb24nLCAnbG9jYXRpb24nLCAnYWRtaW4nLCAnbWFuYWdlciddXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7XG4gICAgICAgIHN0YXJ0RGF0ZTogJ2Rlc2MnXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICh1c2VyUm9sZSkge1xuICAgICAgLy8gTWFwIHJvbGUgdHlwZXMgdG8gbWFuYWdlbWVudCBsZXZlbHNcbiAgICAgIGxldCBtYW5hZ2VtZW50TGV2ZWwgPSB1c2VyUm9sZS5yb2xlVHlwZVxuICAgICAgaWYgKHVzZXJSb2xlLnJvbGVUeXBlID09PSAnYWRtaW4nIHx8IHVzZXJSb2xlLnJvbGVUeXBlID09PSAnbWFuYWdlcicpIHtcbiAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoZXkncmUgb3JnYW5pemF0aW9uIG9yIGxvY2F0aW9uIGxldmVsIGJhc2VkIG9uIGNvbnRleHRcbiAgICAgICAgaWYgKHVzZXJSb2xlLm9yZ2FuaXphdGlvbklkKSB7XG4gICAgICAgICAgbWFuYWdlbWVudExldmVsID0gJ29yZ2FuaXphdGlvbidcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYW5hZ2VtZW50TGV2ZWwgPSAnbWFzdGVyJ1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XG4gICAgICAgIHJvbGU6IHtcbiAgICAgICAgICByb2xlVHlwZTogbWFuYWdlbWVudExldmVsLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiB1c2VyUm9sZS5vcmdhbml6YXRpb25JZFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIE5vIHJvbGUgZm91bmQgZm9yIHRoaXMgdXNlciAtIHRoZXkgbmVlZCB0byBjb21wbGV0ZSB0aGVpciBwcm9maWxlXG4gICAgLy8gQ2hlY2sgaWYgdGhleSBoYXZlIGEgcGFydHkgcmVjb3JkXG4gICAgY29uc3QgdXNlclBhcnR5ID0gYXdhaXQgZGIucGFydHkuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHVzZXJJZDogdXNlcklkIH1cbiAgICB9KVxuXG4gICAgaWYgKCF1c2VyUGFydHkpIHtcbiAgICAgIC8vIFVzZXIgaGFzIG5vIHBhcnR5IHJlY29yZCB5ZXQgLSB0aGV5IG5lZWQgdG8gY29tcGxldGUgdGhlaXIgcHJvZmlsZVxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcbiAgICAgICAgcm9sZToge1xuICAgICAgICAgIHJvbGVUeXBlOiAnbmV3X3VzZXInLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiBudWxsXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCB0byBvcmdhbml6YXRpb24gbGV2ZWwgZm9yIGV4aXN0aW5nIHVzZXJzIHdpdGhvdXQgcm9sZXNcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgcm9sZToge1xuICAgICAgICByb2xlVHlwZTogJ29yZ2FuaXphdGlvbicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiBudWxsXG4gICAgICB9XG4gICAgfSlcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIHVzZXIgcm9sZTonLCBlcnJvcilcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIHVzZXIgcm9sZScgXG4gICAgfSwgeyBzdGF0dXM6IDUwMCB9KVxuICB9XG59ICJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJhdXRoIiwiZGIiLCJHRVQiLCJ1c2VySWQiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJjb25zdWx0YW50Um9sZSIsInJvbGUiLCJmaW5kRmlyc3QiLCJ3aGVyZSIsInBhcnR5IiwiY29uc3VsdGFudCIsImlzTm90Iiwicm9sZVR5cGUiLCJpc0FjdGl2ZSIsImluY2x1ZGUiLCJvcmdhbml6YXRpb25JZCIsInVzZXJSb2xlIiwiaW4iLCJvcmRlckJ5Iiwic3RhcnREYXRlIiwibWFuYWdlbWVudExldmVsIiwidXNlclBhcnR5IiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/user/role/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/db/index.ts":
/*!*************************!*\
  !*** ./src/db/index.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst db = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log: [\n        \"query\"\n    ]\n});\nif (true) globalForPrisma.prisma = db;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvZGIvaW5kZXgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTZDO0FBRTdDLE1BQU1DLGtCQUFrQkM7QUFJakIsTUFBTUMsS0FDWEYsZ0JBQWdCRyxNQUFNLElBQ3RCLElBQUlKLHdEQUFZQSxDQUFDO0lBQ2ZLLEtBQUs7UUFBQztLQUFRO0FBQ2hCLEdBQUU7QUFFSixJQUFJQyxJQUF5QixFQUFjTCxnQkFBZ0JHLE1BQU0sR0FBR0QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jb21wbGlhbmNlLWFwcC10ZW1wLy4vc3JjL2RiL2luZGV4LnRzP2RhYzYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnXG5cbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7XG4gIHByaXNtYTogUHJpc21hQ2xpZW50IHwgdW5kZWZpbmVkXG59XG5cbmV4cG9ydCBjb25zdCBkYiA9XG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPz9cbiAgbmV3IFByaXNtYUNsaWVudCh7XG4gICAgbG9nOiBbJ3F1ZXJ5J10sXG4gIH0pXG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gZGIgIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsImdsb2JhbEZvclByaXNtYSIsImdsb2JhbFRoaXMiLCJkYiIsInByaXNtYSIsImxvZyIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/db/index.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/@clerk","vendor-chunks/next","vendor-chunks/cookie"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fuser%2Frole%2Froute&page=%2Fapi%2Fuser%2Frole%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fuser%2Frole%2Froute.ts&appDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fpatrick%2FDocuments%2FDevelopment%2Fcompliance_app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();