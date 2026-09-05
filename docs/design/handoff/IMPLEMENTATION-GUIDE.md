# CLAUDE.md — VitalPair (frontend)

Guia pro Claude Code implementar a UI do VitalPair num codebase real. Leia inteiro antes de codar.

## O que é
VitalPair é o "Duolingo da saúde para casais": jogo de dois jogadores, temporadas de 30 dias com aposta, placar ao vivo, mascote evolutivo (o **Broto**), registro de refeição por foto (<10s) e uma **loja de customização** do mascote. Web app — **NUNCA cara de app mobile** (sidebar + conteúdo, layout de desktop).

Os dois jogadores de referência são **você** (laranja) e a **Célia** (roxo).

## Stack (alvo real)
React 19 · TypeScript ~6 · Vite 8 · **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first com `@theme`) · **Zustand 5** (persist) · React Router 7 · Axios (interceptors c/ refresh JWT) · i18next (PT/EN/ES/FR). Backend Java/Spring por fora.

## Fidelidade: ALTA
Os mockups `.dc.html` em `reference/` são a fonte da verdade visual (claro **e** escuro). Reproduza fielmente em React. Este pacote traz tokens + componentes-base + o mascote prontos — use-os, não reinvente.

## Tom de voz (vale pra TODA string de UI e i18n)
Falar como **gente de verdade**, brasileiro e informal. Nunca marketing/IA.
- **Faça:** frases curtas, jeito de papo ("bora", "na real", "vacilou", "de boa", "manda um mimo"), provocação carinhosa do par, humor leve.
- **Evite (tells de IA):** simetrias "sem X, sem Y"; listinhas de três paralelas; "zero planilha / em tempo real / consistência / jornada / eleve sua"; stats inventados; em-dash decorativo "—" (use vírgula ou ponto); termo médico ou inglês desnecessário.
- Exemplos certos: "Ninguém cuida da saúde sozinho por muito tempo." · "Vacilou dois dias? Ela passa na sua frente." · "É mais rápido que postar no story." · "Manda um mimo (ou um perrengue) pra Célia."
- As chaves i18n PT são a referência de tom; as outras línguas seguem o espírito, não a tradução literal.

## Lei das cores (NÃO-NEGOCIÁVEL — cada cor tem UM papel)
- **laranja** (`brand`) = VOCÊ + energia + marca: logo, nav ativa, seu Broto, CTAs, streak, seu lado do placar.
- **roxo** (`rival`) = a CÉLIA / o par, e só: Broto dela, lado dela do placar, eventos dela no feed, presentear. No **modo solo** o adversário é cinza-fantasma (`ghost`), nunca roxo.
- **verde** (`success`) = saúde, meta batida, quem está ganhando, pontos, anel de calorias, vitória.
- **dourado** (`carb`) = macro de carboidrato; e o brilho de item **lendário** na loja.
- **vermelho** (`danger`) = sabotar a Célia (a zoeira), erros.
- neutros quentes = estrutura/chrome.
Nunca hardcode hex nas telas; use tokens (`bg-brand`, `text-rival-ink`, `bg-success-soft`…). Raridade na loja (cinza/azul/dourado) é uma escala visual à parte — não briga com os papéis. Trocar paleta = editar só `:root`/`.dark` em `theme.css`.

## Tipografia
**Fredoka** (display/números/títulos) + **Nunito** (corpo/UI). Arredondada com personalidade, sem ser infantil. Ícones **SVG preenchidos** — nada de emoji como ícone.

## Tema claro/escuro (obrigatório, os dois lindos)
Claro = creme quente; escuro = carvão-âmbar aconchegante (NUNCA navy/clínico). Estado em `useTheme` (Zustand persist) → aplica `.dark` no `<html>`. Script anti-flash no `index.html` (ver comentário em `useTheme.ts`). Componentes não sabem de tema; só leem tokens.

## A marca: o Broto
O mascote é um **Broto** — uma sementinha de energia/vida com carinha. O broto na cabeça é a assinatura ("vita" = vida brotando). Ele **reage** (feliz, provoca, triste se você abandona) e **evolui** com a rotina, do nível 1 (sementinha) ao 8 (cheio de folha + flor). São **dois**: o seu (laranja, sobrancelha) e o da Célia (roxo, cílios). Slogan: **"Saúde é melhor em dupla."**
Componente pronto: `src/components/Broto.tsx` → `<Broto who="you|partner" expr="happy|smug|sad|strong" level={1..8} size={120} />`. Os ícones de item da loja e detalhes finos do Broto são SVG simples de propósito — viram arte ilustrada real depois.

## O que já vem pronto neste pacote
```
src/
  styles/theme.css            tokens @theme + claro/escuro + keyframes
  store/useTheme.ts           Zustand persist do tema (+ recipe anti-flash)
  components/
    Broto.tsx                 o mascote (who/expr/level/size)
    BrandMark.tsx             lockup Broto + VitalPair
    Button.tsx                primary | secondary | success | ghost
    Badge.tsx                 status + <Points/>
    Avatar.tsx                tone you | rival | ghost
    CalorieRing.tsx           anel-assinatura animado
    Scoreboard.tsx            placar da temporada (par e solo)
reference/                    todos os mockups .dc.html (claro+escuro) + support.js
```

## Telas a construir (mockups em reference/ → rotas)
Landing · Login/Cadastro · Onboarding · Dashboard (par **e** solo) · Registrar refeição · Registrar atividade · Feed do par · Plano alimentar · Plano de treino · Temporada/Placar · Missões · Conquistas · Perfil · Progresso · Configurações · Detalhe da refeição · Convite do par · Fim de temporada (animado) · **Lojinha do Broto** (showcase + armário + vitrine + detalhe + compra + presentear/sabotar).

## Lojinha do Broto (customização)
- Aba **Meu Broto**: showcase do avatar equipado + **armário** agrupado por slot (cabeça, rosto, vaso, fundo, etc.), toque pra vestir/tirar.
- Aba **Vitrine**: grade de itens com **raridade** comum/raro/lendário (lendário com brilho dourado) e preço em **moedas** (ganha jogando) ou **gemas** (dinheiro real, itens exclusivos).
- **Detalhe do item**: prévia no seu Broto + comprar. **Pop-up** de confirmação com saldo.
- **Presentear** (roxo) e **Sabotar** (vermelho) a Célia: dá pra mandar mimo ou perrengue. Slots de item são extensíveis (chapéu, óculos, roupa, vaso, plantas, fundo, skins, cenário) — modele como catálogo pra adicionar item novo sem mexer em UI.

## Gamificação (elegante, sem infantilizar)
Anel satisfatório, streak (chama laranja), placar VS com os Brotos, missão relâmpago, marcos que acendem, celebração só no Fim de temporada (confete nas cores da marca). Sem estrelinha/confete espalhado.

## Acessibilidade
Contraste AA nos dois temas, foco visível, alvos ≥40px, `aria-label` nos ícones, `prefers-reduced-motion` respeitado.
