const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const ANAM_CJS_ENTRY = path.resolve(
  __dirname,
  "node_modules/@anam-ai/js-sdk/dist/main/index.js",
);

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

/**
 * @anam-ai/js-sdk ships an ESM "module" build with extensionless re-exports
 * that Metro cannot resolve on Windows. Force CJS + fix relative imports.
 */
function resolveAnamModule(context, moduleName) {
  if (
    moduleName === "@anam-ai/js-sdk" ||
    moduleName === "@anam-ai/js-sdk/dist/main" ||
    moduleName === "@anam-ai/js-sdk/dist/main/index.js" ||
    moduleName === "@anam-ai/js-sdk/dist/main/index"
  ) {
    return { type: "sourceFile", filePath: ANAM_CJS_ENTRY };
  }

  const origin = context.originModulePath || "";
  const inAnam = origin.includes(`${path.sep}@anam-ai${path.sep}js-sdk${path.sep}`);
  if (!inAnam || typeof moduleName !== "string" || !moduleName.startsWith(".")) {
    return null;
  }

  // If somehow still inside dist/module, jump to the twin file under dist/main.
  const originMain = origin.replace(
    `${path.sep}dist${path.sep}module${path.sep}`,
    `${path.sep}dist${path.sep}main${path.sep}`,
  );
  const fromDir = path.dirname(originMain);
  const base = path.resolve(fromDir, moduleName);
  const candidates = [base, `${base}.js`, path.join(base, "index.js")];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { type: "sourceFile", filePath: candidate };
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

  const anam = resolveAnamModule(context, moduleName);
  if (anam) {
    return anam;
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withApiRouteFix;
