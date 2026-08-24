/**
 * Normalização e comparação de nomes de jogador.
 *
 * Existe pra evitar o caso que já aconteceu na prática: o jogador entra no link
 * de convite, não olha a lista, digita o próprio nome de novo e vira um segundo
 * cadastro — que racha o histórico dele no ranking e nas conquistas.
 */

/** minúsculo, sem acento, sem espaço duplicado — a chave de comparação */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/** Distância de edição (Levenshtein), pra pegar erro de digitação: "Vinicus" vs "Vinicius" */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

const MIN_PREFIX_LEN = 3

/**
 * Nomes que provavelmente são a mesma pessoa. Cobre três casos:
 * apelido/prefixo ("Vini" / "Vinicius"), primeiro nome igual ("João" / "João Pedro")
 * e erro de digitação ("Vinicus" / "Vinicius").
 */
export function isSimilarName(a: string, b: string): boolean {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (!na || !nb) return false
  if (na === nb) return true

  const shorter = na.length <= nb.length ? na : nb
  const longer = shorter === na ? nb : na
  if (shorter.length >= MIN_PREFIX_LEN && longer.startsWith(shorter)) return true

  const firstA = na.split(' ')[0]
  const firstB = nb.split(' ')[0]
  if (firstA.length >= MIN_PREFIX_LEN && firstA === firstB) return true

  const maxLen = Math.max(na.length, nb.length)
  return levenshtein(na, nb) <= (maxLen <= 5 ? 1 : 2)
}

export interface NamedRecord { id: string; name: string }

/** Jogadores já cadastrados que podem ser a mesma pessoa que `name` */
export function findSimilarPlayers<T extends NamedRecord>(name: string, players: T[]): T[] {
  return players.filter((p) => isSimilarName(name, p.name))
}

/** Jogador com exatamente o mesmo nome normalizado, se existir */
export function findExactPlayer<T extends NamedRecord>(name: string, players: T[]): T | undefined {
  const target = normalizeName(name)
  return players.find((p) => normalizeName(p.name) === target)
}
