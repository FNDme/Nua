// Renders the anime.js promo scene (index.html) frame by frame into an MP4
// and a GIF, plus the static store tile. Not part of the extension build.
//
//   cd store-assets/promo
//   npm i --no-save puppeteer-core ffmpeg-static
//   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node render.mjs
//
// Frames are captured by seeking the paused timeline (window.__promo.seek), so
// the output is identical on every run regardless of machine speed.

import { execFileSync } from "node:child_process"
import { mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import ffmpeg from "ffmpeg-static"
import puppeteer from "puppeteer-core"

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, "..")
const FPS = 30
const SCALE = Number(process.env.SCALE ?? 3) // 440x280 stage -> 1320x840 video
const executablePath =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const framesDir = path.join(here, ".frames")
rmSync(framesDir, { recursive: true, force: true })
mkdirSync(framesDir)

const browser = await puppeteer.launch({ executablePath, headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 440, height: 280, deviceScaleFactor: SCALE })
// Any hash pauses the timeline instead of autoplaying it
await page.goto(pathToFileURL(path.join(here, "index.html")).href + "#t=0")
await page.waitForFunction(() => window.__promo)
const duration = await page.evaluate(() => window.__promo.duration)

const total = Math.ceil((duration / 1000) * FPS)
for (let i = 0; i <= total; i++) {
  const ms = (i / FPS) * 1000
  await page.evaluate((t) => window.__promo.seek(t), ms)
  await page.screenshot({
    path: path.join(framesDir, `f${String(i).padStart(4, "0")}.png`)
  })
}

// Static tile: the final frame at exactly 440x280
await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 })
await page.evaluate((t) => window.__promo.seek(t), duration)
await page.screenshot({ path: path.join(out, "promo-small-440x280.png") })
await browser.close()

const frames = path.join(framesDir, "f%04d.png")
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", frames,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart",
  path.join(out, "nua-promo.mp4")
])
// GIF (README / social): smaller, with a generated palette for clean gradients
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", frames,
  "-vf", "fps=20,scale=660:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192[p];[b][p]paletteuse=dither=sierra2_4a",
  path.join(out, "nua-promo.gif")
])
rmSync(framesDir, { recursive: true, force: true })
console.log(`Rendered ${total + 1} frames (${duration} ms) at ${440 * SCALE}x${280 * SCALE}`)
