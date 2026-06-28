# CLAUDE.md — VitalPair (frontend)

Guia pro Claude Code implementar a UI do VitalPair. Leia inteiro antes de codar.

## O que é
VitalPair é o "Duolingo da saúde para casais": jogo de dois jogadores, temporadas de 30 dias com aposta, placar em tempo real, personagem evolutivo, registro de refeição por foto (<10s). Web app — **NUNCA cara de app mobile**.

## Stack (alvo real)
React 19 · TypeScript ~6 · Vite 8 · **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first com `@theme`) · **Zustand 5** (persist) · React Router 7 · Axios (interceptors c/ refresh JWT) · i18next (PT/EN/ES/FR). Backend (Java/Spring) é plugado por fora — aqui é só frontend.

## Fidelidade: ALTA
Os mockups `.dc.html` na raiz do projeto são a fonte da verdade visual (claro **e** escuro). Reproduza fielmente em React. Este pacote já traz os tokens + componentes-base prontos — use-os, não reinvente.

## Landing page (é a primeira a construir)
Referência visual: **`reference/VitalPair Landing.dc.html`** (claro e escuro). Reproduza fielmente em React + Tailwind v4, usando os tokens do `theme.css` e o **Broto** (`components/Broto.tsx`) como herói. Pontos da landing:
- Herói com os dois Brotos + headline no tom humano + CTA laranja de criar conta. Reconhecer o **modo solo** (joga com alguém OU contra você mesmo), não só dupla.
- Explicar o conceito sem enrolar: temporada de 30 dias, placar do casal, aposta, registro de refeição por foto. Nada de stat inventado.
- Claro e escuro, os dois bonitos. Sem cara de IA: sem em-dash decorativo, sem listinha de três, sem "em tempo real/consistência/jornada".

## Tom de voz (vale pra TODA string de UI e i18n)
Falar como **gente de verdade**, brasileiro e informal. Nunca marketing/IA.
- **Faça:** frases curtas, jeito de papo ("bora", "na real", "vacilou", "de boa"), provocação carinhosa do par, humor leve.
- **Evite (tells de IA):** simetrias "sem X, sem Y"; listinhas de três paralelas; "zero planilha / em tempo real / consistência / jornada"; stats inventados; em-dash decorativo; termo médico ou inglês desnecessário.
- Exemplos certos: "Ninguém cuida da saúde sozinho por muito tempo." · "Vacilou dois dias? Ela passa na sua frente." · "É mais rápido que postar no story." · "Então, bora?"
- As chaves i18n PT são a referência de tom; as outras línguas seguem o espírito, não a tradução literal.

## Lei das cores (NÃO-NEGOCIÁVEL — cada cor tem UM papel)
- **laranja** (`brand`) = VOCÊ + energia + marca: logo, nav ativa, seu avatar, CTAs, streak, seu lado do placar.
- **roxo** (`rival`) = a CÉLIA / o par-rival, e só: avatar dela, lado dela do placar, eventos dela no feed. No **modo solo** o adversário é cinza-fantasma (`ghost`), nunca roxo.
- **verde** (`success`) = saúde, meta batida, quem está ganhando, pontos, anel de calorias, vitória.
- **dourado** (`carb`) = macro de carboidrato (família quente, não rouba o roxo).
- neutros quentes = estrutura/chrome.
Nunca hardcode hex nas telas; use os tokens (`bg-brand`, `text-rival-ink`, `bg-success-soft`…). Trocar paleta = editar só `:root` / `.dark` em `theme.css`.

## Tipografia
**Fredoka** (display/números/títulos) + **Nunito** (corpo/UI). Arredondada com personalidade, sem ser infantil. Ícones **SVG preenchidos** — nada de emoji como ícone. (Os badges ainda usam emoji placeholder nos mockups; trocar por arte real depois.)

## Tema claro/escuro (obrigatório, os dois lindos)
Claro = creme quente; escuro = carvão-âmbar aconchegante (NUNCA navy/clínico). Estado em `useTheme` (Zustand persist) → aplique `.dark` no `<html>`. Script anti-flash no `index.html` (ver comentário em `useTheme.ts`). Componentes não sabem de tema; só leem tokens.

## A marca & o mascote (o Broto)
O nome é **VitalPair**. O personagem é o **Broto**: uma sementinha de energia com carinha que floresce conforme você se cuida (nível 1 a 8; no 8 abre uma flor bordô). São dois — o seu (laranja, com sobrancelha) e o da Célia (roxo, com cílios) — porque saúde é melhor em dupla.
- Componente pronto: **`components/Broto.tsx`** → `<Broto who="you|partner" expr="happy|smug|sad|strong" level={1..8} size={120} />`. Use como avatar no header, placar e perfil (no lugar dos emoji placeholder).
- Guia visual completo (poses, expressões, evolução, lockup): **`reference/VitalPair Brotos.html`** (abre no navegador).
- Lockup da marca = os dois Brotos + a palavra **VitalPair** + slogan **"Saúde é melhor em dupla."**
- `BrandMark.tsx` (o anel) vira só um ícone abstrato secundário; o rosto da marca é o Broto.

## O que já vem pronto neste pacote
```
src/
  styles/theme.css            ← tokens @theme + claro/escuro + keyframes (importe no entry)
  store/useTheme.ts           ← Zustand persist do tema (+ recipe anti-flash)
  components/
    BrandMark.tsx             BrandMark / BrandLockup
    Button.tsx                primary | secondary | success | ghost
    Badge.tsx                 status + <Points/> (pontos = verde)
    Avatar.tsx                tone you | rival | ghost (slot p/ personagem real)
    CalorieRing.tsx           anel-assinatura animado
    Scoreboard.tsx            o placar da temporada (par e solo)
    Broto.tsx                 o MASCOTE (who/expr/level/size) — o avatar do app
```

## Telas a construir (mockups na raiz → rotas)
Landing · Login/Cadastro · Onboarding (perfil→atividade→TDEE→par/solo→aposta) · Dashboard (par **e** solo) · Registrar refeição · Registrar atividade · Feed do par · Plano alimentar · Plano de treino · Temporada/Placar · Missões · Conquistas · Perfil · Progresso · Configurações · Detalhe da refeição · Convite do par · **Fim de temporada** (animado).

## Gamificação (elegante, sem infantilizar)
Anel satisfatório, streak (chama laranja), placar VS, missão relâmpago, marcos que acendem, celebração só no Fim de temporada (confete nas cores da marca — único lugar). Sem estrelinha/confete espalhado.

## Acessibilidade
Contraste AA nos dois temas, foco visível, alvos ≥40px, `aria-label` nos ícones, `prefers-reduced-motion` respeitado nas animações.
