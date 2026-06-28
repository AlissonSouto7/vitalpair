# VitalPair — Handoff de frontend

Pacote pra implementar a UI no stack de vocês: **React 19 + TypeScript + Vite + Tailwind v4 + Zustand**.

Comece pelo **`CLAUDE.md`** — guia completo: tom de voz, lei das cores, marca (o Broto), tema claro/escuro, todas as telas e a loja.

## O que tem aqui
- **`CLAUDE.md`** — o guia. Leia primeiro.
- **`src/styles/theme.css`** — todos os tokens em `@theme` + `:root`/`.dark`. Importe no entry depois de `tailwindcss`. Trocar paleta = só aqui.
- **`src/store/useTheme.ts`** — tema claro/escuro persistido (Zustand) + receita anti-flash.
- **`src/components/`** — base pronta: `Broto` (o mascote), `BrandMark`, `Button`, `Badge`/`Points`, `Avatar`, `CalorieRing`, `Scoreboard`.
- **`reference/`** — TODOS os mockups visuais (`.dc.html`, claro + escuro, interativos): Landing, Auth, Onboarding, Dashboard (par e solo), Registrar, Atividade, Feed, Temporada, Missões, Perfil, Progresso, Planos, Configurações, Detalhe da refeição, Convite, Fim de temporada e a **Lojinha do Broto**. Mais o guia `VitalPair Brotos.html` e o componente `Broto.dc.html`. São a referência pixel a pixel.

## Setup rápido
```bash
npm create vite@latest vitalpair-frontend -- --template react-ts
cd vitalpair-frontend
npm i tailwindcss @tailwindcss/vite zustand react-router-dom axios i18next react-i18next
```
1. `vite.config.ts`: adicione o plugin `@tailwindcss/vite`.
2. Copie `src/styles/theme.css` e importe no `main.tsx`.
3. Cole o script anti-flash no `index.html` (ver comentário em `useTheme.ts`).
4. Copie `src/components/` e `src/store/`.
5. Monte as telas a partir de `reference/` usando esses componentes.

## Regras de ouro
1. Nunca hardcode cor — sempre token. Nunca quebre o papel de cada cor (laranja=você, roxo=Célia, verde=saúde/meta, dourado=carbo/lendário, vermelho=sabotar).
2. Web (sidebar + conteúdo), nunca cara de mobile.
3. Toda string no tom humano BR. As chaves PT mandam no tom.
4. Claro e escuro, os dois caprichados.
5. O Broto é a marca — use `<Broto/>` como avatar/herói; ícones de item da loja são placeholders SVG (viram arte real depois).
