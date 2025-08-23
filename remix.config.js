/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  serverBuildTarget: "netlify",
  server: "./server.js",   // 👈 this must exist in root
};
