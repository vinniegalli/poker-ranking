import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const RankingContent = nextDynamic(() => import('./RankingContent'), { ssr: false })

export default function Page() {
  return <RankingContent />
}
