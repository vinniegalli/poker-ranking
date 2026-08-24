import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const InfoContent = nextDynamic(() => import('./InfoContent'), { ssr: false })

export default function InfoPage() {
  return <InfoContent />
}
