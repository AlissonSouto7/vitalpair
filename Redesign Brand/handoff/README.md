# VitaPair — Handoff de frontend

Pacote pra implementar a UI no stack de vocês: **React 19 + TypeScript + Vite + Tailwind v4 + Zustand**.

- **`CLAUDE.md`** — o guia completo: tom de voz, lei das cores, marca, tema, e a lista de telas. Comece por ele.
- **`src/styles/theme.css`** — todos os tokens em `@theme` + `:root`/`.dark`. Importe no seu entry CSS depois de `tailwindcss`. Trocar paleta = só aqui.
- **`src/store/useTheme.ts`** — tema claro/escuro persistido (Zustand) + receita anti-flash.
- **`src/components/`** — componentes-base já no padrão: `BrandMark`, `Button`, `Badge`/`Points`, `Avatar`, `CalorieRing`, `Scoreboard`.

Os mockups visuais (claro + escuro, interativos) estão nos arquivos `VitaPair *.dc.html` na raiz do projeto — são a referência pixel a pixel pra reproduzir cada tela.

## Setup rápido
```bash
npm create vite@latest vitapair-frontend -- --template react-ts
cd vitapair-frontend
npm i tailwindcss @tailwindcss/vite zustand react-router-dom axios i18next react-i18next
```
1. `vite.config.ts`: adicione o plugin `@tailwindcss/vite`.
2. Copie `src/styles/theme.css` e importe no `main.tsx` (`import './styles/theme.css'`).
3. Cole o script anti-flash no `index.html` (ver comentário em `useTheme.ts`).
4. Copie `src/components/` e `src/store/`.
5. Monte as telas a partir dos mockups usando esses componentes.

## Regras de ouro
1. Nunca hardcode cor — sempre token. Nunca quebre o papel de uma cor (laranja=você, roxo=Ana, verde=saúde/meta, dourado=carbo).
2. Web (sidebar + conteúdo), nunca cara de mobile.
3. Toda string no tom humano BR. As chaves PT mandam no tom.
4. Claro e escuro, os dois caprichados.
