#!/usr/bin/env node
/**
 * Fetch a static FFmpeg build into tools/ffmpeg/bin/ for the current platform.
 *
 * Sources:
 *  - darwin : evermeet.cx (static, non-GPL extras)
 *  - win32  : gyan.dev (essential build)
 *  - linux  : johnvansickle.com (static, GPL) with BtbN fallback
 *
 * Usage:
 *   node scripts/fetch-ffmpeg.mjs                # detect platform
 *   node scripts/fetch-ffmpeg.mjs --platform win32
 *   node scripts/fetch-ffmpeg.mjs --skip-verify
 */
import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { chmodSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binDir = join(root, "tools", "ffmpeg", "bin");
const cacheDir = join(root, "cache", "ffmpeg-downloads");

const args = process.argv.slice(2);
const platformFlag = args.find((a) => a.startsWith("--platform="))?.split("=")[1];
const skipVerify = args.includes("--skip-verify");

const platform = platformFlag ?? process.platform;

const sources = {
  darwin: () => [
    { name: "ffmpeg", url: "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" },
    { name: "ffprobe", url: "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip" },
  ],
  win32: () => [
    {
      name: "ffmpeg",
      url: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
      nested: true,
    },
  ],
  linux: () => [
    {
      name: "ffmpeg",
      url: "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
      nested: true,
    },
  ],
};

async function download(url, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) {
    console.log(`cached: ${dest}`);
    return;
  }
  console.log(`downloading ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  const file = createWriteStream(dest);
  const body = Readable.fromWeb(res.body);
  await new Promise((resolve, reject) => {
    body.on("error", reject);
    file.on("finish", resolve);
    file.on("error", reject);
    body.pipe(file);
  });
}

function extract(archive, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  if (archive.endsWith(".zip")) {
    execFileSync("unzip", ["-q", "-o", archive, "-d", targetDir], { stdio: "inherit" });
  } else {
    execFileSync("tar", ["-xJf", archive, "-C", targetDir], { stdio: "inherit" });
  }
}

function findBinary(base, name) {
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) stack.push(full);
      else if (entry === name || entry === `${name}.exe`) return full;
    }
  }
  return null;
}

async function main() {
  const make = sources[platform];
  if (!make) {
    console.error(`unsupported platform: ${platform}`);
    process.exit(1);
  }

  mkdirSync(binDir, { recursive: true });
  const batches = make();

  for (const spec of batches) {
    const ext = spec.url.endsWith(".zip") ? "zip" : spec.url.endsWith(".tar.xz") ? "tar.xz" : "bin";
    const archive = join(cacheDir, `${spec.name}-${platform}.${ext}`);
    await download(spec.url, archive);

    const stage = join(cacheDir, `stage-${spec.name}`);
    rmSync(stage, { recursive: true, force: true });
    extract(archive, stage);

    if (spec.nested) {
      const target = findBinary(stage, spec.name);
      if (!target) throw new Error(`no ${spec.name} binary found in archive`);
      execFileSync("cp", [target, join(binDir, platform === "win32" ? `${spec.name}.exe` : spec.name)]);
    } else {
      const target = findBinary(stage, spec.name);
      if (!target) throw new Error(`no ${spec.name} binary found in archive`);
      execFileSync("cp", [target, join(binDir, spec.name)]);
    }
    rmSync(stage, { recursive: true, force: true });
    console.log(`installed ${spec.name} -> ${binDir}`);
  }

  if (platform !== "win32") {
    chmodSync(join(binDir, "ffmpeg"), 0o755);
    chmodSync(join(binDir, "ffprobe"), 0o755);
  }

  if (!skipVerify) {
    const ffmpegPath = join(binDir, platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    const out = execFileSync(ffmpegPath, ["-version"], { encoding: "utf8" });
    console.log(out.split("\n")[0]);
  }
  console.log("ffmpeg ready at", binDir);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});