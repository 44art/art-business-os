import type { Brand, Artwork, Workshop, Persona, ContentDraft, LandingPageDraft, LineStrategyDraft, SnsStrategyDraft, ConsultantReport } from '@/types'

const KEYS = {
  brand: 'abo_brand',
  artworks: 'abo_artworks',
  workshops: 'abo_workshops',
  personas: 'abo_personas',
  contentDrafts: 'abo_content_drafts',
  lpDrafts: 'abo_lp_drafts',
  lineDrafts: 'abo_line_drafts',
  snsDrafts: 'abo_sns_strategy_drafts',
  consultantReports: 'abo_consultant_reports',
} as const

function isBrowser() {
  return typeof window !== 'undefined'
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Brand（シングルトン）────────────────────────────────

export function getBrand(): Brand | null {
  return read<Brand | null>(KEYS.brand, null)
}

export function saveBrand(brand: Brand): void {
  write(KEYS.brand, brand)
}

// ─── Artworks ────────────────────────────────────────────

export function getArtworks(): Artwork[] {
  return read<Artwork[]>(KEYS.artworks, [])
}

export function getArtworkById(id: string): Artwork | null {
  return getArtworks().find((a) => a.id === id) ?? null
}

export function saveArtwork(artwork: Artwork): void {
  const list = getArtworks()
  list.unshift(artwork)
  write(KEYS.artworks, list)
}

export function updateArtwork(id: string, data: Partial<Artwork>): void {
  const list = getArtworks().map((a) =>
    a.id === id ? { ...a, ...data } : a
  )
  write(KEYS.artworks, list)
}

export function deleteArtwork(id: string): void {
  write(KEYS.artworks, getArtworks().filter((a) => a.id !== id))
}

// ─── Workshops ───────────────────────────────────────────

export function getWorkshops(): Workshop[] {
  return read<Workshop[]>(KEYS.workshops, [])
}

export function getWorkshopById(id: string): Workshop | null {
  return getWorkshops().find((w) => w.id === id) ?? null
}

export function saveWorkshop(workshop: Workshop): void {
  const list = getWorkshops()
  list.unshift(workshop)
  write(KEYS.workshops, list)
}

export function updateWorkshop(id: string, data: Partial<Workshop>): void {
  const list = getWorkshops().map((w) =>
    w.id === id ? { ...w, ...data } : w
  )
  write(KEYS.workshops, list)
}

export function deleteWorkshop(id: string): void {
  write(KEYS.workshops, getWorkshops().filter((w) => w.id !== id))
}

// ─── Personas ────────────────────────────────────────────

export function getPersonas(): Persona[] {
  return read<Persona[]>(KEYS.personas, [])
}

export function getPersonaById(id: string): Persona | null {
  return getPersonas().find((p) => p.id === id) ?? null
}

export function savePersona(persona: Persona): void {
  const list = getPersonas()
  list.unshift(persona)
  write(KEYS.personas, list)
}

export function updatePersona(id: string, data: Partial<Persona>): void {
  const list = getPersonas().map((p) =>
    p.id === id ? { ...p, ...data } : p
  )
  write(KEYS.personas, list)
}

export function deletePersona(id: string): void {
  write(KEYS.personas, getPersonas().filter((p) => p.id !== id))
}

// ─── ContentDrafts ───────────────────────────────────────

export function getContentDrafts(): ContentDraft[] {
  return read<ContentDraft[]>(KEYS.contentDrafts, [])
}

export function getContentDraftById(id: string): ContentDraft | null {
  return getContentDrafts().find((c) => c.id === id) ?? null
}

export function saveContentDraft(draft: ContentDraft): void {
  const list = getContentDrafts()
  list.unshift(draft)
  write(KEYS.contentDrafts, list)
}

export function updateContentDraft(id: string, data: Partial<ContentDraft>): void {
  const list = getContentDrafts().map((c) =>
    c.id === id ? { ...c, ...data } : c
  )
  write(KEYS.contentDrafts, list)
}

export function deleteContentDraft(id: string): void {
  write(KEYS.contentDrafts, getContentDrafts().filter((c) => c.id !== id))
}

// ─── LandingPageDrafts ───────────────────────────────────

export function getLpDrafts(): LandingPageDraft[] {
  return read<LandingPageDraft[]>(KEYS.lpDrafts, [])
}

export function getLpDraftById(id: string): LandingPageDraft | null {
  return getLpDrafts().find((l) => l.id === id) ?? null
}

export function saveLpDraft(draft: LandingPageDraft): void {
  const list = getLpDrafts()
  list.unshift(draft)
  write(KEYS.lpDrafts, list)
}

export function updateLpDraft(id: string, data: Partial<LandingPageDraft>): void {
  const list = getLpDrafts().map((l) =>
    l.id === id ? { ...l, ...data } : l
  )
  write(KEYS.lpDrafts, list)
}

export function deleteLpDraft(id: string): void {
  write(KEYS.lpDrafts, getLpDrafts().filter((l) => l.id !== id))
}

// ─── LineStrategyDrafts ──────────────────────────────────

export function getLineDrafts(): LineStrategyDraft[] {
  return read<LineStrategyDraft[]>(KEYS.lineDrafts, [])
}

export function getLineDraftById(id: string): LineStrategyDraft | null {
  return getLineDrafts().find((l) => l.id === id) ?? null
}

export function saveLineDraft(draft: LineStrategyDraft): void {
  const list = getLineDrafts()
  list.unshift(draft)
  write(KEYS.lineDrafts, list)
}

export function updateLineDraft(id: string, data: Partial<LineStrategyDraft>): void {
  const list = getLineDrafts().map((l) =>
    l.id === id ? { ...l, ...data } : l
  )
  write(KEYS.lineDrafts, list)
}

export function deleteLineDraft(id: string): void {
  write(KEYS.lineDrafts, getLineDrafts().filter((l) => l.id !== id))
}

// ─── SnsStrategyDrafts ───────────────────────────────────

export function getSnsDrafts(): SnsStrategyDraft[] {
  return read<SnsStrategyDraft[]>(KEYS.snsDrafts, [])
}

export function getSnsDraftById(id: string): SnsStrategyDraft | null {
  return getSnsDrafts().find((s) => s.id === id) ?? null
}

export function saveSnsDraft(draft: SnsStrategyDraft): void {
  const list = getSnsDrafts()
  list.unshift(draft)
  write(KEYS.snsDrafts, list)
}

export function updateSnsDraft(id: string, data: Partial<SnsStrategyDraft>): void {
  const list = getSnsDrafts().map((s) =>
    s.id === id ? { ...s, ...data } : s
  )
  write(KEYS.snsDrafts, list)
}

export function deleteSnsDraft(id: string): void {
  write(KEYS.snsDrafts, getSnsDrafts().filter((s) => s.id !== id))
}

// ─── ConsultantReports ───────────────────────────────────

export function getConsultantReports(): ConsultantReport[] {
  return read<ConsultantReport[]>(KEYS.consultantReports, [])
}

export function getConsultantReportById(id: string): ConsultantReport | null {
  return getConsultantReports().find((r) => r.id === id) ?? null
}

export function saveConsultantReport(report: ConsultantReport): void {
  const list = getConsultantReports()
  list.unshift(report)
  write(KEYS.consultantReports, list)
}

export function updateConsultantReport(id: string, data: Partial<ConsultantReport>): void {
  const list = getConsultantReports().map((r) =>
    r.id === id ? { ...r, ...data } : r
  )
  write(KEYS.consultantReports, list)
}

export function deleteConsultantReport(id: string): void {
  write(KEYS.consultantReports, getConsultantReports().filter((r) => r.id !== id))
}
