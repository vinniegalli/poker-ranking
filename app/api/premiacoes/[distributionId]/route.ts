import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { distributionId: string } }
) {
  const { error } = await supabase
    .from('premiacoes')
    .delete()
    .eq('distribution_id', params.distributionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
