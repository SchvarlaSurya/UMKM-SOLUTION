import { calculateAllHpp } from '@/lib/hppCalculator'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const thresholdParam = searchParams.get('threshold')
  const threshold = thresholdParam ? Number(thresholdParam) : undefined
  const hasil = await calculateAllHpp(threshold)
  return NextResponse.json(hasil)
}
