import { Badge, BadgeTheme, BadgeTier } from './badges'

const THEME_BG_TEXT: Record<BadgeTheme, string> = {
  sequencia: 'bg-amber-500/10 text-amber-400',
  estilo: 'bg-purple-500/10 text-purple-400',
  recorde: 'bg-gold/10 text-gold',
  participacao: 'bg-emerald-500/10 text-emerald-400',
  premio: 'bg-pink-500/10 text-pink-400',
}

const THEME_BORDER: Record<BadgeTheme, string> = {
  sequencia: 'border-amber-500/20',
  estilo: 'border-purple-500/20',
  recorde: 'border-gold/20',
  participacao: 'border-emerald-500/20',
  premio: 'border-pink-500/20',
}

// Bronze/prata/ouro: usado nas badges com níveis, pra diferenciar visualmente o degrau atingido
const TIER_BORDER: Record<BadgeTier, string> = {
  bronze: 'border-orange-700/70',
  prata: 'border-slate-300/70',
  ouro: 'border-yellow-400/80',
}

/** Classes Tailwind (fundo + texto + borda) pra um chip de conquista, já considerando o tier quando houver */
export function badgeChipClass(badge: Pick<Badge, 'theme' | 'tier'>): string {
  const border = badge.tier ? TIER_BORDER[badge.tier] : THEME_BORDER[badge.theme]
  const borderWidth = badge.tier ? 'border-2' : 'border'
  return `${THEME_BG_TEXT[badge.theme]} ${border} ${borderWidth}`
}
