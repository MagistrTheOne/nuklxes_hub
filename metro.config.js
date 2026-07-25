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

/** Fix @anam-ai/js-sdk ESM extensionless relative imports for Metro. */
function resolveAnamRelative(context, moduleName) {
  const origin = context.originModulePath || "";
  if (!origin.includes(`${path.sep}@anam-ai${path.sep}js-sdk${path.sep}`)) {
    return null;
  }
  if (typeof moduleName !== "string" || !moduleName.startsWith(".")) {
    return null;
  }

  const base = path.resolve(path.dirname(origin), moduleName);
  const candidates = [
    base,
    `${base}.js`,
    path.join(base, "index.js"),
  ];

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

  // Prefer CJS entry — ESM "module" build breaks Metro resolution.
  if (moduleName === "@anam-ai/js-sdk") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/@anam-ai/js-sdk/dist/main/index.js",
      ),
    };
  }

  const anamRelative = resolveAnamRelative(context, moduleName);
  if (anamRelative) {
    return anamRelative;
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withApiRouteFix;
