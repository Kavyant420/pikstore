import { NextResponse } from 'next/server'
import { GitHubError, getRepo, isSafeSegment, resolveAllPlatforms } from '@/lib/github'
import { isNexusApp, NEXUS_MODEL_MANIFEST } from '@/lib/nexus'
import type { AppDetails } from '@/lib/scan-types'

export async function GET(_request: Request, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params
  if (!isSafeSegment(owner) || !isSafeSegment(repo)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Nexus is first-party: no GitHub releases exist yet (signed installers
  // land in a later stage), so serve its details from the pinned manifest.
  if (isNexusApp(owner, repo)) {
    const desktop = NEXUS_MODEL_MANIFEST.Q4_K_M
    const mobile = NEXUS_MODEL_MANIFEST['UD-IQ2_XXS']
    const body: AppDetails = {
      description: 'A private, fully-offline AI assistant. On-device llama.cpp inference, zero cloud.',
      stars: 0,
      license: 'MIT',
      avatar: '/pikstore-mark.png',
      homepage: 'https://github.com/pik-intelligence/nexus-ai',
      builds: {
        android: {
          name: mobile.file,
          size: mobile.bytes,
          version: 'v0.1 · UD-IQ2_XXS',
          publishedAt: mobile.provisioned_at,
          downloads: 0,
        },
        ios: null,
        macos: null,
        windows: {
          name: desktop.file,
          size: desktop.bytes,
          version: 'v0.1 · Q4_K_M',
          publishedAt: desktop.provisioned_at,
          downloads: 0,
        },
      },
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  }

  try {
    const [info, assets] = await Promise.all([getRepo(owner, repo), resolveAllPlatforms(owner, repo)])
    const builds = Object.fromEntries(
      Object.entries(assets).map(([platform, asset]) => [
        platform,
        asset
          ? {
              name: asset.name,
              size: asset.size,
              version: asset.version,
              publishedAt: asset.publishedAt,
              downloads: asset.downloads,
            }
          : null,
      ]),
    ) as AppDetails['builds']

    const body: AppDetails = {
      description: info.description,
      stars: info.stargazers_count,
      license: info.license?.spdx_id && info.license.spdx_id !== 'NOASSERTION' ? info.license.spdx_id : null,
      avatar: info.owner.avatar_url,
      homepage: info.html_url,
      builds,
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
  } catch (error) {
    const status = error instanceof GitHubError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status })
  }
}
