import {
  BadgeTheme, BadgeTier, Level,
  STREAK_THRESHOLD, MIN_SESSIONS_FOR_STYLE, SEMPRE_POR_PERTO_THRESHOLD,
  ISCA_MIN_BUYINS, VIRADA_MIN_BUYINS, CIRURGIAO_TOLERANCIA,
  VETERANO_LEVELS, SALDO_TOTAL_LEVELS, FIEL_LEVELS,
  DONO_DA_MESA_LEVELS, PAO_DURO_LEVELS, REBUY_KING_LEVELS,
  DOBROU_MULTIPLICADOR, NEW_BADGES_SINCE,
} from './badges'

export interface BadgeCatalogEntry {
  id: string
  icon: string
  name: string
  theme: BadgeTheme
  howTo: string
  levels?: { tier: BadgeTier; requirement: string }[]
  /** Conquistas novas não valem retroativo — a data vira um selo "conta a partir de" */
  since?: string
}

// Os arrays de nível em lib/badges.ts vêm do maior pro menor (pra achar o nível mais alto
// atingido); aqui invertemos só pra exibir na ordem natural bronze → prata → ouro.
function levelsFromArray(levels: Level[], fmt: (min: number) => string) {
  return [...levels].reverse().map((l) => ({ tier: l.tier, requirement: fmt(l.min) }))
}

export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  {
    id: 'em_chamas', icon: '🔥', name: 'Em chamas', theme: 'sequencia',
    howTo: `Vença ${STREAK_THRESHOLD} sessões seguidas`,
  },
  {
    id: 'fase_ruim', icon: '🧊', name: 'Fase ruim', theme: 'sequencia',
    howTo: `Perca ${STREAK_THRESHOLD} sessões seguidas`,
  },
  {
    id: 'rocha', icon: '🪨', name: 'Rocha', theme: 'estilo',
    howTo: `Esteja entre os 3 jogadores com resultado mais consistente do grupo (mín. ${MIN_SESSIONS_FOR_STYLE} sessões jogadas)`,
    levels: [
      { tier: 'ouro', requirement: '1º mais consistente do grupo' },
      { tier: 'prata', requirement: '2º mais consistente do grupo' },
      { tier: 'bronze', requirement: '3º mais consistente do grupo' },
    ],
  },
  {
    id: 'montanha_russa', icon: '🎢', name: 'Montanha-russa', theme: 'estilo',
    howTo: `Esteja entre os 3 jogadores com resultado mais instável do grupo (mín. ${MIN_SESSIONS_FOR_STYLE} sessões jogadas)`,
    levels: [
      { tier: 'ouro', requirement: '1º mais instável do grupo' },
      { tier: 'prata', requirement: '2º mais instável do grupo' },
      { tier: 'bronze', requirement: '3º mais instável do grupo' },
    ],
  },
  {
    id: 'shark', icon: '🦈', name: 'Shark', theme: 'estilo',
    howTo: `Esteja entre os 3 jogadores com maior taxa de vitória do grupo (mín. ${MIN_SESSIONS_FOR_STYLE} sessões jogadas)`,
    levels: [
      { tier: 'ouro', requirement: '1º em taxa de vitória' },
      { tier: 'prata', requirement: '2º em taxa de vitória' },
      { tier: 'bronze', requirement: '3º em taxa de vitória' },
    ],
  },
  {
    id: 'isca', icon: '🎣', name: 'Isca', theme: 'estilo',
    howTo: `Compre ${ISCA_MIN_BUYINS}+ fichas numa sessão e ainda assim saia no vermelho`,
  },
  {
    id: 'virada', icon: '🔄', name: 'Virada', theme: 'estilo',
    howTo: `Compre ${VIRADA_MIN_BUYINS}+ fichas numa sessão e mesmo assim termine no azul`,
  },
  {
    id: 'cirurgiao', icon: '🔬', name: 'Cirurgião', theme: 'estilo',
    howTo: `Termine uma sessão a menos de R$${CIRURGIAO_TOLERANCIA} do zero a zero`,
  },
  {
    id: 'pao_duro', icon: '🪙', name: 'Pão-duro', theme: 'estilo', since: NEW_BADGES_SINCE,
    howTo: 'Jogue sessões seguidas sem recomprar nenhuma vez (1 buy-in por noite)',
    levels: levelsFromArray(PAO_DURO_LEVELS, (min) => `${min} sessões seguidas sem recomprar`),
  },
  {
    id: 'rebuy_king', icon: '💸', name: 'Rebuy king', theme: 'estilo', since: NEW_BADGES_SINCE,
    howTo: 'O nível vem da noite em que você mais recomprou fichas',
    levels: levelsFromArray(REBUY_KING_LEVELS, (min) => `${min}+ fichas numa única noite`),
  },
  {
    id: 'grande_vitoria', icon: '💰', name: 'Grande vitória', theme: 'recorde',
    howTo: 'O nível é definido pela sua melhor sessão — quanto mais ganhou numa única noite, mais alto o nível',
    levels: [
      { tier: 'bronze', requirement: 'Ganhou R$10 a R$49 numa sessão' },
      { tier: 'prata', requirement: 'Ganhou R$50 a R$99 numa sessão' },
      { tier: 'ouro', requirement: 'Ganhou R$100+ numa sessão' },
    ],
  },
  {
    id: 'grande_perda', icon: '💀', name: 'Grande perda', theme: 'recorde',
    howTo: 'O nível é definido pela sua pior sessão — perder menos dá um nível melhor que perder mais',
    levels: [
      { tier: 'ouro', requirement: 'Pior sessão entre R$10 e R$49 de prejuízo' },
      { tier: 'prata', requirement: 'Pior sessão entre R$50 e R$99 de prejuízo' },
      { tier: 'bronze', requirement: 'Pior sessão de R$100+ de prejuízo' },
    ],
  },
  {
    id: 'marco_saldo', icon: '💎', name: 'Marco de saldo', theme: 'recorde',
    howTo: 'Acumule saldo positivo ao longo da carreira',
    levels: levelsFromArray(SALDO_TOTAL_LEVELS, (min) => `R$${min}+ de saldo acumulado`),
  },
  {
    id: 'podio_do_ano', icon: '👑', name: 'Pódio do ano', theme: 'recorde',
    howTo: 'Termine entre os 3 primeiros do ranking de algum ano',
    levels: [
      { tier: 'ouro', requirement: '1º lugar no ranking do ano (Rei do ranking)' },
      { tier: 'prata', requirement: '2º lugar no ranking do ano (Vice-campeão)' },
      { tier: 'bronze', requirement: '3º lugar no ranking do ano' },
    ],
  },
  {
    id: 'dono_da_mesa', icon: '🏆', name: 'Dono da mesa', theme: 'recorde', since: NEW_BADGES_SINCE,
    howTo: 'Termine a noite como o maior ganhador da mesa. Quanto mais noites, maior o nível',
    levels: levelsFromArray(DONO_DA_MESA_LEVELS, (min) => `${min}x maior ganhador da noite`),
  },
  {
    id: 'lanterninha', icon: '🪫', name: 'Lanterninha', theme: 'recorde', since: NEW_BADGES_SINCE,
    howTo: 'Termine a noite como o maior perdedor da mesa (alguém tem que pagar a conta)',
  },
  {
    id: 'dobrou', icon: '💵', name: 'Dobrou', theme: 'recorde', since: NEW_BADGES_SINCE,
    howTo: `Saia da noite com ${DOBROU_MULTIPLICADOR}x ou mais do que colocou em fichas`,
  },
  {
    id: 'fenix', icon: '🐦‍🔥', name: 'Fênix', theme: 'recorde', since: NEW_BADGES_SINCE,
    howTo: 'Esteja com saldo acumulado negativo na carreira e vire pro positivo',
  },
  {
    id: 'sempre_por_perto', icon: '🎯', name: 'Sempre por perto', theme: 'participacao',
    howTo: `Participe de ${Math.round(SEMPRE_POR_PERTO_THRESHOLD * 100)}%+ das sessões encerradas em algum ano`,
  },
  {
    id: 'veterano', icon: '🎖️', name: 'Veterano', theme: 'participacao',
    howTo: 'Jogue várias sessões ao longo do tempo',
    levels: levelsFromArray(VETERANO_LEVELS, (min) => `${min}+ sessões jogadas`),
  },
  {
    id: 'fiel', icon: '📅', name: 'Fiel', theme: 'participacao',
    howTo: 'Jogue em múltiplos anos diferentes',
    levels: levelsFromArray(FIEL_LEVELS, (min) => `Jogou em ${min}+ anos diferentes`),
  },
  {
    id: 'estreante', icon: '🐣', name: 'Estreante', theme: 'participacao',
    howTo: 'Jogue sua primeira sessão',
  },
  {
    id: 'sortudo', icon: '🎁', name: 'Sortudo', theme: 'premio',
    howTo: 'Já tenha ganhado alguma premiação (do ranking ou da Quadra do Mês)',
  },
]
