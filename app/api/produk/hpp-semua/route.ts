import { calculateAllHpp } from '@/lib/hppCalculator'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(req: Request) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const thresholdParam = searchParams.get('threshold')
  const threshold = thresholdParam ? Number(thresholdParam) : undefined
  const hasil = await calculateAllHpp(threshold)
  return NextResponse.json(hasil)
}
