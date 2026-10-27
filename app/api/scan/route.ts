import { NextResponse, type NextRequest } from 'next/server'
import { GitHubError, getRepo, isSafeSegment, resolveAsset } from '@/lib/github'
import { isPlatform } from '@/lib/platform'
import { scanAsset } from '@/lib/scanner'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const owner = params.get('owner')
  const repo = params.get('repo')
  const platform = params.get('platform')
  const arch = params.get('arch') === 'arm' ? 'arm' : 'x86'

  if (!isSafeSegment(owner) || !isSafeSegment(repo) || !isPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const [repoInfo, asset] = await Promise.all([getRepo(owner, repo), resolveAsset(owner, repo, platform, arch)])
    if (!asset) {
      return NextResponse.json({ error: 'No installer published for this platform', code: 'no_asset' }, { status: 404 })
    }
    const report = await scanAsset(repoInfo, asset, platform)
    return NextResponse.json(report)
  } catch (error) {
    const status = error instanceof GitHubError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status })
  }
}
