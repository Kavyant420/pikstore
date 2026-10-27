import { NextResponse, type NextRequest } from 'next/server'
import type { StoreApp } from '@/lib/catalog'
import { CATALOG } from '@/lib/catalog'
import { GitHubError, searchRepos } from '@/lib/github'

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 60)
  if (query.length < 2) return NextResponse.json({ results: [] })

  try {
    const known = new Set(CATALOG.map((a) => a.id.toLowerCase()))
    const hits = await searchRepos(query.replace(/[^\w\s.+-]/g, ' '))
    const notAnApp = /\b(awesome|list|lists|collection|tutorials?|course|interview|cheat-?sheets?|wordlists?|books?|roadmap|guide|resources)\b/i
    const results: StoreApp[] = hits
      .filter((h) => !known.has(h.full_name.toLowerCase()))
      .filter((h) => !notAnApp.test(`${h.name} ${h.description ?? ''}`))
      .map((h) => ({
        id: h.full_name,
        owner: h.owner.login,
        repo: h.name,
        name: h.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        tagline: h.description?.slice(0, 140) ?? 'Open-source project on GitHub.',
        avatar: h.owner.avatar_url,
        stars: h.stargazers_count,
      }))
    return NextResponse.json({ results })
  } catch (error) {
    const status = error instanceof GitHubError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed', results: [] }, { status })
  }
}
