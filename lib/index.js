/**
 * dsh-drop-to-path — host side.
 *
 * Registers one exact HTTP route on the DSH webServer:
 *   POST /_dsh/drop-to-path/import  { name, dataBase64, workspace?, relpath?, batch? }
 * Writes the decoded file into the active session workspace `.drops/`
 * directory and returns the absolute path.
 *
 * Three kinds of uploads are accepted:
 *   - images (png/jpg/jpeg/webp/gif, ≤30MB)  → sent via the wrapped
 *     conversation.sendSession while keeping the native attachment UI;
 *   - documents/media (pdf/office/plain/zip/video/audio, ≤100MB) → inserted
 *     into the composer as a plain path by the browser side;
 *   - folder contents (relpath = "<folder>/<...>/<file>", any extension,
 *     ≤100MB each) → written under .drops/<batch>/ preserving structure;
 *     the response carries `dir` (the folder root) so the client can queue
 *     one folder chip instead of one chip per file.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { appendFileSync } from 'node:fs'
import { basename, extname, isAbsolute, join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

export const IMPORT_ROUTE = '/_dsh/drop-to-path/import'

const MAX_BODY_BYTES = 140 * 1024 * 1024 // JSON body cap (~100MB file in base64)
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MAX_IMAGE_BYTES = 30 * 1024 * 1024
const MAX_FILE_BYTES = 100 * 1024 * 1024
const DROP_DIR = '.drops'

export const name = '@dsh-external/dsh-drop-to-path'

/** Read the whole request body as UTF-8 text with a hard size cap. */
async function readBody(req, limit) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > limit) throw new Error('payload too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** Resolve the active session workspace root from the durable workspace registry. */
async function workspaceRoot() {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  const store = join(dshHome, 'storages', 'workspace.json')
  let parsed
  try {
    parsed = JSON.parse(await readFile(store, 'utf8'))
  } catch (error) {
    throw new Error(`cannot read workspace registry: ${error instanceof Error ? error.message : String(error)}`)
  }
  const workspaces = parsed?.tables?.workspaces
  if (typeof workspaces !== 'object' || workspaces === null) throw new Error('workspace registry is empty')
  const ids = Object.keys(workspaces)
  if (ids.length === 0) throw new Error('no workspace registered')
  let best = ids[0]
  for (const id of ids) {
    if ((workspaces[id].updatedAt ?? '') > (workspaces[best].updatedAt ?? '')) best = id
  }
  const path = workspaces[best]?.path
  if (typeof path !== 'string' || path.length === 0) throw new Error('workspace has no path')
  return path
}

/** Strip path separators and control characters from an uploaded file name.
 *  Unicode (Chinese etc.), spaces and dots are preserved; only characters
 *  that are illegal in Windows file names are replaced. */
function safeName(raw) {
  const base = basename(String(raw ?? ''))
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .trim()
    .slice(0, 120)
  return base.length === 0 ? 'file' : base
}

/** Sanitize a folder-upload relative path: split into segments, drop
 *  dot/traversal segments and illegal characters. Returns null when no
 *  usable segment remains. Depth is capped to keep paths manageable. */
function safeRelpath(raw) {
  const segs = String(raw ?? '')
    .split(/[\\/]+/)
    .map((seg) => seg.replace(/[:*?"<>|\x00-\x1f]/g, '_').trim())
    .filter((seg) => seg.length > 0 && seg !== '.' && seg !== '..')
    .slice(0, 12)
    .map((seg) => seg.slice(0, 80))
  return segs.length === 0 ? null : segs
}

export async function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: IMPORT_ROUTE,
        handler: async (req, res) => {
          const respond = (value, status = 200) => {
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(value))
          }
          try {
            if (req.method !== 'POST') {
              try {
                const u = new URL(req.url ?? '/', 'http://x')
                // Host-side clipboard bitmap extraction: browsers cannot read
                // CF_BITMAP (e.g. Win+V history panel items), but .NET can.
                // Saves the bitmap to <workspace>/.drops and returns a path
                // the client can queue as a chip.
                if (u.searchParams.get('clipboardImage') !== null) {
                  try {
                    const root = await workspaceRoot()
                    if (!root) {
                      respond({ ok: false, error: { code: 'no-workspace', message: 'No workspace root found' } }, 200)
                      return
                    }
                    const name = `${Date.now()}-clipboard.png`
                    const outPath = join(root, DROP_DIR, name)
                    const scriptPath = fileURLToPath(new URL('clipboard-image.ps1', import.meta.url))
                    const { stdout } = await execFileAsync(
                      'powershell.exe',
                      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-OutPath', outPath],
                      { timeout: 15000 },
                    )
                    const text = String(stdout ?? '').trim()
                    if (text.startsWith('SAVED:')) {
                      respond({ ok: true, value: { path: outPath, name } }, 200)
                    } else {
                      respond({ ok: false, error: { code: 'clipboard', message: text.slice(0, 200) || 'no image on clipboard' } }, 200)
                    }
                  } catch (error) {
                    respond({ ok: false, error: { code: 'clipboard', message: error instanceof Error ? error.message.slice(0, 200) : String(error) } }, 200)
                  }
                  return
                }
                // Lightweight clipboard probe for the client's right-click
                // interception: reports whether the clipboard carries any
                // image (including CF_BITMAP the browser itself cannot see).
                if (u.searchParams.get('clipboardState') !== null) {
                  try {
                    const scriptPath = fileURLToPath(new URL('clipboard-state.ps1', import.meta.url))
                    const { stdout } = await execFileAsync(
                      'powershell.exe',
                      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
                      { timeout: 8000 },
                    )
                    respond({ ok: true, value: { hasImage: String(stdout ?? '').trim().startsWith('IMAGE') } }, 200)
                  } catch (error) {
                    respond({ ok: false, error: { code: 'clipboard', message: error instanceof Error ? error.message.slice(0, 200) : String(error) } }, 200)
                  }
                  return
                }
                // Image preview streaming for queued chips: the browser cannot
                // load local file paths, so the host serves .drops images back.
                if (u.searchParams.get('file') !== null) {
                  try {
                    const target = resolve(u.searchParams.get('file') ?? '')
                    const ext = extname(target).toLowerCase()
                    const dropsSeg = `${sep}${DROP_DIR}${sep}`
                    if (!IMAGE_EXTENSIONS.has(ext) || !target.includes(dropsSeg)) {
                      respond({ ok: false, error: { code: 'forbidden', message: 'Only .drops images are served' } }, 403)
                      return
                    }
                    const data = await readFile(target)
                    const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
                    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' })
                    res.end(data)
                  } catch {
                    respond({ ok: false, error: { code: 'not-found', message: 'file not found' } }, 404)
                  }
                  return
                }
                // Client boot diagnostic beacon: ?beacon=<json> appends one line
                // to .beacon.log next to this file (best-effort diagnostics).
                const raw = u.searchParams.get('beacon')
                if (raw !== null) {
                  const logUrl = new URL('.beacon.log', import.meta.url)
                  const line = `${new Date().toISOString()} ${raw.slice(0, 400)}\n`
                  appendFileSync(logUrl, line)
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ ok: true }))
                  return
                }
              } catch { /* beacon failures fall through to 405 */ }
              respond({ ok: false, error: { code: 'method-not-allowed', message: 'Use POST' } }, 405)
              return
            }
            let body
            try {
              body = JSON.parse(await readBody(req, MAX_BODY_BYTES))
            } catch (error) {
              respond({ ok: false, error: { code: 'invalid-request', message: error instanceof Error ? error.message : String(error) } }, 400)
              return
            }
            const { name: rawName, dataBase64, workspace: clientWorkspace, relpath: rawRelpath, batch: rawBatch } = body
            if (typeof dataBase64 !== 'string' || dataBase64.length === 0) {
              respond({ ok: false, error: { code: 'invalid-request', message: 'Missing dataBase64' } }, 400)
              return
            }
            // Trust the client-supplied active workspace only when it is an
            // absolute path; otherwise fall back to the registry scan so a
            // stale or tampered payload can never write outside a real root.
            const root = typeof clientWorkspace === 'string' && isAbsolute(clientWorkspace)
              ? clientWorkspace
              : await workspaceRoot()
            const bytes = Buffer.from(dataBase64, 'base64')
            const safe = safeName(rawName)
            const dot = safe.lastIndexOf('.')
            const ext = (dot >= 0 ? safe.slice(dot) : '').toLowerCase()

            // Folder mode: a relative path with at least <folder>/<file>
            // keeps the dropped directory structure under .drops/<batch>/.
            const relSegments = rawRelpath === undefined ? null : safeRelpath(rawRelpath)
            const folderMode = relSegments !== null && relSegments.length >= 2

            // Images keep their dedicated rail; EVERY other extension
            // (.html, .py, .log, .ps1, no extension at all...) lands as a
            // regular file — folder mode already allowed any extension, so
            // single-file mode now matches it.
            let kind, limit
            if (IMAGE_EXTENSIONS.has(ext)) { kind = 'image'; limit = MAX_IMAGE_BYTES }
            else { kind = 'file'; limit = MAX_FILE_BYTES }
            if (bytes.length === 0 || bytes.length > limit) {
              respond({ ok: false, error: { code: 'too-large', message: `File exceeds ${Math.floor(limit / 1024 / 1024)}MB` } }, 413)
              return
            }

            if (folderMode) {
              // One batch directory per dropped folder (client supplies the
              // batch stamp); the relative path keeps the inner structure.
              const batchSegs = safeRelpath(rawBatch ?? relSegments[0])
              const batchName = batchSegs === null ? 'folder' : batchSegs.join('-')
              const inner = relSegments.slice(1)
              inner[inner.length - 1] = safe
              const folderRoot = join(root, DROP_DIR, batchName)
              const dir = join(folderRoot, ...inner.slice(0, -1))
              await mkdir(dir, { recursive: true })
              const target = join(dir, inner[inner.length - 1])
              await writeFile(target, bytes)
              respond({ ok: true, value: { path: target, dir: folderRoot, filename: safe, bytes: bytes.length, kind: 'folder-file' } })
              return
            }

            const dir = join(root, DROP_DIR)
            await mkdir(dir, { recursive: true })
            const target = join(dir, `${Date.now()}-${safe}`)
            await writeFile(target, bytes)
            respond({ ok: true, value: { path: target, filename: basename(target), bytes: bytes.length, kind } })
          } catch (error) {
            respond({ ok: false, error: { code: 'import-failed', message: error instanceof Error ? error.message : String(error) } }, 500)
          }
        },
      })
      return dispose
    }, 'drop-to-path: import route')
  })
}
