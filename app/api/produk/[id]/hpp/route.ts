import { calculateHpp } from '@/lib/hppCalculator'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const result = await calculateHpp(Number(idParam))
  return NextResponse.json(result)
}
