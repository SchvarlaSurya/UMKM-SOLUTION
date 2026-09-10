import { calculateHpp } from '@/lib/hppCalculator'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: idParam } = await params
  const { searchParams } = new URL(req.url)
  const thresholdParam = searchParams.get('threshold')
  const threshold = thresholdParam ? Number(thresholdParam) : undefined
  const result = await calculateHpp(Number(idParam), threshold)
  return NextResponse.json(result)
}
