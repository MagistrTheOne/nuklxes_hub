const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/**
 * Windows + Expo SSR: API routes are requested as absolute posix paths
 * (D:/.../me+api.ts). Metro often fails to resolve those and reports the
 * relative path as missing even though the file exists on disk.
 */
function resolveWindowsApiRoute(moduleName) {
  if (typeof moduleName !== "string" || !moduleName.includes("+api")) {
    return null;
  }

  const normalized = moduleName.replace(/\//g, path.sep);
  const absolute = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(__dirname, normalized);

  const candidates = [absolute];
  if (!/\.[cm]?[jt]sx?$/.test(absolute)) {
    candidates.push(`${absolute}.ts`, `${absolute}.js`, `${absolute}.tsx`);
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { type: "sourceFile", filePath: candidate };
      }
    } catch {
      // ignore invalid paths
    }
  }

  return null;
}

const withApiRouteFix = withNativeWind(config, { input: "./src/global.css" });
const upstreamResolveRequest = withApiRouteFix.resolver.resolveRequest;

withApiRouteFix.resolver.resolveRequest = (context, moduleName, platform) => {
  const apiRoute = resolveWindowsApiRoute(moduleName);
  if (apiRoute) {
    return apiRoute;
  }

  // @anam-ai/js-sdk "module" build uses extensionless ESM re-exports
  // (e.g. './DataChannelMessage') that Metro cannot resolve. Force CJS.
  if (moduleName === "@anam-ai/js-sdk") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/@anam-ai/js-sdk/dist/main/index.js",
      ),
    };
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withApiRouteFix;
