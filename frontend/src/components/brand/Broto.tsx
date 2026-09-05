import React from 'react'

/**
 * Broto — mascote do VitalPair, como componente React.
 * who: 'you' (laranja) | 'partner' (roxo/Célia)
 * expr: 'happy' | 'smug' | 'sad' | 'strong'
 * level: 1..8 (o broto na cabeça cresce; nível 8 floresce numa flor bordô)
 * size: altura em px
 */
type Who = 'you' | 'partner'
type Expr = 'happy' | 'smug' | 'sad' | 'strong'
type Colors = {
  body: string
  light: string
  dark: string
  belly: string
  cheek: string
  sprout: string
  sproutLt: string
}

const ORANGE: Colors = {
  body: '#ff7a2e',
  light: '#ffac63',
  dark: '#dd5a16',
  belly: '#fff0db',
  cheek: 'rgba(255,120,80,.4)',
  sprout: '#3fae5e',
  sproutLt: '#5fce80',
}
const PURPLE: Colors = {
  body: '#9b5cf0',
  light: '#c49bf6',
  dark: '#7338cf',
  belly: '#f4eefe',
  cheek: 'rgba(180,120,255,.34)',
  sprout: '#3fae5e',
  sproutLt: '#5fce80',
}
const INK = '#2a1810'

const e = React.createElement

function sproutEls(c: Colors, lvl: number) {
  const out: React.ReactNode[] = []
  const L = Math.max(1, Math.min(8, lvl))
  const stemTop = Math.max(4, 15 - L * 1.5)
  out.push(
    e('path', {
      key: 'st',
      d: `M50 20 L50 ${stemTop + 1}`,
      fill: 'none',
      stroke: c.sprout,
      strokeWidth: 2.8,
      strokeLinecap: 'round',
    }),
  )
  const ly = stemTop,
    s = 0.5 + L * 0.105
  const leaves: React.ReactNode[] = [
    e('path', { key: 'r', d: 'M0 2 C6 -4 12 -2 13 3 C7 5 1 4 0 2 Z', fill: c.sproutLt }),
  ]
  if (L >= 2)
    leaves.unshift(
      e('path', { key: 'l', d: 'M0 1 C-6 -5 -12 -3 -13 2 C-7 4 -2 3 0 1 Z', fill: c.sprout }),
    )
  if (L >= 5)
    leaves.push(
      e('path', { key: 'c', d: 'M0 1 C-2 -7 1 -12 3 -14 C3 -8 3 -3 0 1 Z', fill: c.sprout }),
    )
  out.push(e('g', { key: 'lv', transform: `translate(50 ${ly}) scale(${s})` }, ...leaves))
  if (L === 7)
    out.push(e('circle', { key: 'bud', cx: 50, cy: ly - 6 * s, r: 3.4, fill: '#9b2242' }))
  if (L >= 8) {
    const fy = ly - 6 * s
    ;[0, 1, 2, 3, 4].forEach((i) => {
      const a = i * 72 - 90,
        rad = (a * Math.PI) / 180
      const px = 50 + Math.cos(rad) * 4.4,
        py = fy + Math.sin(rad) * 4.4
      out.push(
        e('ellipse', {
          key: 'p' + i,
          cx: px,
          cy: py,
          rx: 3,
          ry: 4.4,
          fill: '#9b2242',
          transform: `rotate(${a + 90} ${px} ${py})`,
        }),
      )
    })
    out.push(e('circle', { key: 'fc', cx: 50, cy: fy, r: 2.5, fill: '#ffd98a' }))
  }
  return out
}

function build(c: Colors, expr: Expr, g: 'm' | 'f', lvl: number, id: string) {
  const arms = expr === 'strong' ? 'up' : 'side'
  const G: React.ReactNode[] = []
  G.push(
    e(
      'defs',
      { key: 'd' },
      e(
        'linearGradient',
        { id, x1: '0', y1: '0', x2: '0', y2: '1' },
        e('stop', { offset: '0%', stopColor: c.light }),
        e('stop', { offset: '100%', stopColor: c.body }),
      ),
    ),
  )
  G.push(e('ellipse', { key: 'sh', cx: 50, cy: 108, rx: 27, ry: 4.5, fill: 'rgba(0,0,0,.08)' }))
  G.push(e('ellipse', { key: 'f1', cx: 42, cy: 101, rx: 7, ry: 4.5, fill: c.dark }))
  G.push(e('ellipse', { key: 'f2', cx: 58, cy: 101, rx: 7, ry: 4.5, fill: c.dark }))
  if (arms === 'up') {
    G.push(e('ellipse', { key: 'a1', cx: 18, cy: 50, rx: 7, ry: 8.5, fill: c.body }))
    G.push(e('ellipse', { key: 'a2', cx: 82, cy: 50, rx: 7, ry: 8.5, fill: c.body }))
  } else {
    G.push(e('ellipse', { key: 'a1', cx: 15, cy: 66, rx: 7, ry: 9, fill: c.body }))
    G.push(e('ellipse', { key: 'a2', cx: 85, cy: 66, rx: 7, ry: 9, fill: c.body }))
  }
  sproutEls(c, lvl).forEach((el) => G.push(el))
  G.push(
    e('path', {
      key: 'body',
      d: 'M50 18 C72 18 84 35 84 57 C84 80 70 97 50 97 C30 97 16 80 16 57 C16 35 28 18 50 18 Z',
      fill: `url(#${id})`,
    }),
  )
  G.push(
    e('path', {
      key: 'belly',
      d: 'M50 47 C63 47 71 59 70 72 C69 86 60 95 50 95 C40 95 31 86 30 72 C29 59 37 47 50 47 Z',
      fill: c.belly,
    }),
  )
  G.push(e('ellipse', { key: 'c1', cx: 30, cy: 57, rx: 4.6, ry: 3, fill: c.cheek }))
  G.push(e('ellipse', { key: 'c2', cx: 70, cy: 57, rx: 4.6, ry: 3, fill: c.cheek }))
  ;(
    [
      [38, -1],
      [62, 1],
    ] as [number, number][]
  ).forEach(([x, dir], i) => {
    if (expr === 'smug' && dir === 1) {
      G.push(
        e('path', {
          key: 'eye' + i,
          d: `M${x - 7} 47 Q${x} 53 ${x + 7} 47`,
          fill: 'none',
          stroke: INK,
          strokeWidth: 2.6,
          strokeLinecap: 'round',
        }),
      )
    } else {
      G.push(e('ellipse', { key: 'ew' + i, cx: x, cy: 47, rx: 7.6, ry: 9, fill: '#fff' }))
      G.push(e('circle', { key: 'ep' + i, cx: x + 0.5, cy: 49, r: 5, fill: INK }))
      G.push(e('circle', { key: 'eh' + i, cx: x + 2.4, cy: 46.6, r: 1.9, fill: '#fff' }))
      G.push(e('circle', { key: 'eh2' + i, cx: x - 1.4, cy: 51, r: 1, fill: '#fff', opacity: 0.8 }))
      if (g === 'f') {
        G.push(
          e('path', {
            key: 'cl1' + i,
            d: `M${x + dir * 5.5} 39.5 q${dir * 0.5} -3 ${dir * -0.5} -5.2`,
            fill: 'none',
            stroke: INK,
            strokeWidth: 1.8,
            strokeLinecap: 'round',
          }),
        )
        G.push(
          e('path', {
            key: 'cl2' + i,
            d: `M${x + dir * 7.4} 40 q${dir * 1.5} -3 ${dir * 1.2} -5.4`,
            fill: 'none',
            stroke: INK,
            strokeWidth: 1.8,
            strokeLinecap: 'round',
          }),
        )
        G.push(
          e('path', {
            key: 'cl3' + i,
            d: `M${x + dir * 8.8} 42 q${dir * 2.6} -2.4 ${dir * 3.2} -4.4`,
            fill: 'none',
            stroke: INK,
            strokeWidth: 1.8,
            strokeLinecap: 'round',
          }),
        )
      }
    }
  })
  if (g === 'm') {
    const brow = (k: string, d: string) =>
      G.push(
        e('path', { key: k, d, fill: 'none', stroke: INK, strokeWidth: 3, strokeLinecap: 'round' }),
      )
    if (expr === 'smug') {
      brow('b1', 'M29 32 Q34 28 42 32')
      brow('b2', 'M58 36 Q64 37 70 34')
    } else if (expr === 'sad') {
      brow('b1', 'M30 38 Q35 34 42 36')
      brow('b2', 'M58 36 Q65 34 70 38')
    } else if (expr === 'strong') {
      brow('b1', 'M30 32 L42 36')
      brow('b2', 'M58 36 L70 32')
    } else {
      brow('b1', 'M30 34 Q35 31 42 34')
      brow('b2', 'M58 34 Q65 31 70 34')
    }
  }
  if (expr === 'happy') {
    G.push(
      e('path', {
        key: 'm',
        d: 'M44 61 Q50 67 56 61',
        fill: 'none',
        stroke: INK,
        strokeWidth: 2.4,
        strokeLinecap: 'round',
      }),
    )
  } else if (expr === 'smug') {
    G.push(
      e('path', {
        key: 'm',
        d: 'M44 62 Q51 66 57 60',
        fill: 'none',
        stroke: INK,
        strokeWidth: 2.4,
        strokeLinecap: 'round',
      }),
    )
  } else if (expr === 'sad') {
    G.push(
      e('path', {
        key: 'm',
        d: 'M44 65 Q50 60 56 65',
        fill: 'none',
        stroke: INK,
        strokeWidth: 2.4,
        strokeLinecap: 'round',
      }),
    )
    G.push(
      e('path', { key: 'tear', d: 'M64 54 q-2.4 4 0 6.4 q2.4 -2.4 0 -6.4 Z', fill: '#6cc4ff' }),
    )
  } else {
    G.push(e('path', { key: 'm', d: 'M43 60 Q50 69 57 60 Q50 64 43 60 Z', fill: INK }))
    G.push(e('path', { key: 't', d: 'M48 63 Q50 66 52 63 Z', fill: '#ff7a8a' }))
  }
  return G
}

export function Broto({
  who = 'you',
  expr = 'happy',
  level = 6,
  size = 120,
  className,
}: {
  who?: Who
  expr?: Expr
  level?: number
  size?: number
  className?: string
}) {
  const c = who === 'partner' ? PURPLE : ORANGE
  const g: 'm' | 'f' = who === 'partner' ? 'f' : 'm'
  // useId gives a stable per-instance id. A module-level counter would break under
  // React's double render in strict mode and under any concurrent rendering.
  const id = `broto${React.useId().replace(/:/g, '')}`
  return e(
    'svg',
    {
      width: size * 0.84,
      height: size,
      viewBox: '0 -18 100 130',
      className,
      role: 'img',
      'aria-label': 'VitalPair',
      style: { flexShrink: 0 },
    },
    ...build(c, expr, g, level, id),
  )
}

export default Broto
