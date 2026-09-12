import finalTally from '@/data/final-tally.json'

// Upstream official visitor source sheet kept for reference
export const SOURCE_URL =
  'https://script.google.com/a/macros/urios.edu.ph/s/AKfycbwSVxdnKXFYbXG91ViCH-XxQqYnDHVmhdC7z1Euo9vScJhkWKKFdm3E4GdpCcwxg_4lxw/exec?userType=Visitor'

export async function GET() {
  return Response.json(finalTally, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  })
}

export const dynamic = 'force-static'
export const runtime = 'nodejs'
