import { Nav, Rodape } from './chrome'
import { Duvidas, Preco } from './commerce'
import { ComoFunciona, CtaFinal, Hero, Temporada } from './sections'

/**
 * Landing pública (logado-out) do VitalPair.
 * Página standalone de marketing: sem Layout/sidebar, scroll próprio.
 * Copy via i18n (PT/EN/ES/FR), tom humano e brasileiro. Só tokens, nunca hex.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Nav />
      <Hero />
      <ComoFunciona />
      <Temporada />
      <Preco />
      <Duvidas />
      <CtaFinal />
      <Rodape />
    </div>
  )
}
