import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const HomeContent = nextDynamic(() => import('./HomeContent'), { ssr: false })

export default function HomePage() {
  return <HomeContent />
}
