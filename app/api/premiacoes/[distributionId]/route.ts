import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { distributionId: string } }
) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { error } = await supabase
    .from('premiacoes')
    .delete()
    .eq('distribution_id', params.distributionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
