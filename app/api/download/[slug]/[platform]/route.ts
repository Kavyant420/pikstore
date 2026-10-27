import { getApp } from '@/lib/apps'
import { PLATFORM_EXT, PLATFORM_LABEL, PLATFORM_MIME, isPlatform } from '@/lib/platform'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; platform: string }> },
) {
  const { slug, platform } = await params

  if (!isPlatform(platform)) {
    return Response.json({ error: 'Unsupported platform' }, { status: 400 })
  }

  const app = getApp(slug)
  const build = app?.builds[platform]
  if (!app || !build) {
    return Response.json({ error: 'Build not available' }, { status: 404 })
  }

  if (build.url) {
    return Response.redirect(build.url, 302)
  }

  const filename = `${app.name.replace(/\s+/g, '')}-${build.version}.${PLATFORM_EXT[platform]}`
  const manifest = [
    'PikStore build package',
    `App: ${app.name}`,
    `Developer: ${app.developer}`,
    `Platform: ${PLATFORM_LABEL[platform]}`,
    `Version: ${build.version}`,
    `Requires: ${build.minOS}`,
    '',
    'Placeholder installer. Set `url` on this build in lib/apps.ts to serve the real binary.',
  ].join('\n')

  return new Response(manifest, {
    headers: {
      'Content-Type': PLATFORM_MIME[platform],
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
