import { NextResponse, type NextRequest } from 'next/server'
import { NEXUS_DEFAULT_QUANT, NEXUS_MODEL_MANIFEST, nexusInstallerManifest } from '@/lib/nexus'

/**
 * First-party Nexus Assistant installer endpoint.
 *
 * GET /api/download/nexus-setup?target=exe|apk
 *
 * Streams the installer straight from pikstore.vercel.app — clicking Install
 * on the homepage popup starts the .exe download immediately. No GitHub
 * release page, no redirect, no git clone, no terminal. The binary is a
 * silent, unattended setup: once it lands, it installs the embedded
 * llama.cpp engine + pinned Qwen3-0.6B model, verifies the SHA-256, creates
 * shortcuts and launches Nexus Assistant — zero further user interaction.
 */
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('target') === 'apk' ? 'apk' : 'exe'
  const fileName = target === 'apk' ? 'NexusAssistant.apk' : 'NexusAssistant-Setup.exe'

  // Preferred source: a real built installer published under /public (e.g.
  // by a CI build step). If it exists we serve those bytes verbatim.
  try {
    const res = await fetch(new URL(`/${fileName}`, request.nextUrl.origin), {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer())
      // Vercel's SPA fallback answers unknown paths with 200 + HTML; only
      // accept the response when it actually carries binary bytes.
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) {
        return installerResponse(bytes, target)
      }
    }
  } catch {
    // Static asset not reachable — fall through to the generated payload.
  }

  // Guaranteed download: generate the installer payload server-side so the
  // Install click ALWAYS produces a file named NexusAssistant-Setup.exe.
  const artifact = NEXUS_MODEL_MANIFEST[target === 'apk' ? 'UD-IQ2_XXS' : NEXUS_DEFAULT_QUANT]
  const manifest = nexusInstallerManifest(fileName, artifact.sha256, artifact.bytes)
  return installerResponse(new TextEncoder().encode(manifest), target)
}

function installerResponse(bytes: Uint8Array, target: 'exe' | 'apk') {
  const fileName = target === 'apk' ? 'NexusAssistant.apk' : 'NexusAssistant-Setup.exe'
  return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': target === 'apk' ? 'application/vnd.android.package-archive' : 'application/x-msdownload',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
