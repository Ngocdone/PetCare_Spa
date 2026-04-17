/**
 * Cấu hình Vite: React, proxy API → backend, phục vụ thư mục ảnh img/ gốc project.
 */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const imgDir = path.join(projectRoot, 'img')
/** Phục vụ thư mục `img/` gốc project tại `mountPath` (thường `/img`) */
function createStaticImgMiddleware(absoluteDir, indexFile) {
  return (req, res, next) => {
    let rel = req.url.split('?')[0]
    try {
      rel = decodeURIComponent(rel)
    } catch {
      return next()
    }
    rel = rel.replace(/^\/+/, '')
    if (rel.startsWith('img/')) rel = rel.slice(4)
    if (rel.includes('..')) return next()
    if (!rel || rel === '/') {
      if (!indexFile) return next()
      rel = indexFile
    }
    const filePath = path.join(absoluteDir, rel)
    fs.readFile(filePath, (err, buf) => {
      if (err) return next()
      const ext = path.extname(filePath).toLowerCase()
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      }
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
      res.end(buf)
    })
  }
}

function serveDir(mountPath, absoluteDir, options = {}) {
  const indexFile = options.index || null
  const mw = createStaticImgMiddleware(absoluteDir, indexFile)
  return {
    name: `serve-parent:${mountPath}`,
    configureServer(server) {
      server.middlewares.use(mountPath, mw)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mountPath, mw)
    },
  }
}

/** 127.0.0.1 tránh lỗi proxy 502 trên Windows khi `localhost` → IPv6 */
const apiTarget =
  process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001'

/** Proxy dev/preview: `/api` → Express (MySQL), mặc định cổng 3001. */
function buildProxy(base) {
  const baseNorm = base.replace(/\/$/, '')
  const proxy = {}
  if (baseNorm && baseNorm !== '' && baseNorm !== '/') {
    proxy[`${baseNorm}/api`] = {
      target: apiTarget,
      changeOrigin: true,
      rewrite: (p) => p.slice(baseNorm.length) || '/',
    }
    for (const np of ['products', 'team']) {
      proxy[`${baseNorm}/${np}`] = {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (p) => p.slice(baseNorm.length) || '/',
      }
    }
  }
  /** Không dùng `/api/admin` — mọi path bắt đầu `.../admin*` (vd. admin_data.php) bị ăn vào Node và 404 */
  Object.assign(proxy, {
    '/products': { target: apiTarget, changeOrigin: true, ws: true },
    '/team': { target: apiTarget, changeOrigin: true, ws: true },
    '/api': { target: apiTarget, changeOrigin: true },
    /** Ảnh khi middleware local thất bại hoặc preview — cần backend chạy */
    '/img': { target: apiTarget, changeOrigin: true },
  })
  if (baseNorm && baseNorm !== '' && baseNorm !== '/') {
    proxy[`${baseNorm}/img`] = { target: apiTarget, changeOrigin: true }
  }
  return proxy
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const base =
    env.VITE_BASE ||
    (mode === 'production' ? '/webSPA/PetCare_Spa/' : '/')
  const proxy = buildProxy(base)
  return {
    base,
    plugins: [react(), serveDir('/img', imgDir)],
    /** Ràng buộc IPv4 — trùng với FRONTEND_URL=http://127.0.0.1:5173 và redirect VNPay.
     *  Mặc định `localhost` trên Windows đôi khi chỉ nghe ::1, nên mở 127.0.0.1 bị ERR_CONNECTION_REFUSED. */
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: false,
      proxy,
    },
    preview: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: false,
      proxy,
    },
  }
})
