import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { profileQueries } from './queries'

import { chooseMascot } from '@/api/profile'
import { Broto, type Mascot } from '@/components/brand/Broto'
import { getApiErrorMessage } from '@/shared/api/errors'

const OPTIONS: Mascot[] = ['SPROUT', 'BLOSSOM']

/**
 * Escolher a aparência do bicho.
 *
 * O rosto do Broto vinha do papel no par: quem era "você" recebia sobrancelhas grossas e o
 * par recebia cílios, decidido dentro do componente de desenho, sem olhar o perfil. A
 * primeira usuária do app marcou sexo feminino, viu o mascote masculino e perguntou como se
 * troca. Não havia como, e nada na tela dizia que aquilo era papel e não gênero.
 *
 * As duas opções aparecem desenhadas, lado a lado, no nível que a pessoa já alcançou: é uma
 * escolha de aparência, e mostrar o nome sem o desenho pediria que ela adivinhasse.
 */
export function MascotPicker({ current, level }: { current: Mascot | null; level: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const escolher = useMutation({
    mutationFn: chooseMascot,
    onSuccess: async () => {
      // O bicho aparece no início e na tela da dupla também, que leem as próprias queries.
      await queryClient.invalidateQueries({ queryKey: profileQueries.profile().queryKey })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['pair'] })
    },
  })

  return (
    <section className="card">
      <h2 className="font-display text-base font-semibold text-ink">{t('profile.mascotTitle')}</h2>
      <p className="mt-0.5 text-[13px] font-semibold text-muted">{t('profile.mascotHint')}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          /*
           * Sem escolha gravada, o SPROUT aparece marcado porque é o que a pessoa está
           * vendo hoje em todas as telas. Marcar nenhum faria a tela mentir sobre o estado
           * atual; marcar este diz a verdade e deixa a troca a um toque.
           */
          const active = (current ?? 'SPROUT') === option
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              disabled={escolher.isPending}
              onClick={() => escolher.mutate(option)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition disabled:opacity-60 ${
                active ? 'border-act bg-act-soft' : 'border-hair bg-surface hover:border-act/50'
              }`}
            >
              <Broto who="you" expr="happy" level={level} size={92} mascot={option} />
              <span
                className={`text-[13px] font-extrabold ${active ? 'text-act-ink' : 'text-muted'}`}
              >
                {t(option === 'SPROUT' ? 'profile.mascotSprout' : 'profile.mascotBlossom')}
              </span>
            </button>
          )
        })}
      </div>

      {escolher.isError && (
        <p role="alert" className="mt-3 text-xs font-semibold text-danger">
          {getApiErrorMessage(escolher.error, t('profile.mascotError'))}
        </p>
      )}
    </section>
  )
}
