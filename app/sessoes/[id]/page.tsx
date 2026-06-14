import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const SessionContent = nextDynamic(() => import('./SessionContent'), { ssr: false })

export default function Page() {
  return <SessionContent />
}
