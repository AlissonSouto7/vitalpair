import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SERVER_DEFAULT_STAKE } from './stake'

import { updateStake } from '@/api/season'
import { getApiErrorMessage } from '@/shared/api/errors'
import { Field } from '@/shared/ui/form/Field'

/**
 * Mudar o que o perdedor paga.
 *
 * `PUT /api/v1/season/stake` existia desde que a temporada subiu e nenhuma tela o chamava.
 * A aposta aparecia em dois cartões, sempre com o valor que o servidor grava quando ninguém
 * escolheu, e o último passo do onboarding chega a perguntar qual é (sem gravar, porque não
 * existe temporada antes de haver par) prometendo que ela se define aqui.
 *
 * Usado na tela de temporada e nos ajustes do par: é o mesmo acordo, e quem procura por ele
 * vai a um dos dois lugares.
 */
export function StakeEditor({ stake, hasPartner }: { stake: string; hasPartner: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  /*
    Vazio quando a aposta ainda é a que o servidor gravou sozinho.

    Pré-preencher com ela faria a pessoa salvar o padrão como se fosse decisão dela, e numa
    tela em inglês gravaria o texto em português que o servidor usa, ou a tradução dele, como
    se fosse texto livre que alguém escreveu.
  */
  const [value, setValue] = useState(stake === SERVER_DEFAULT_STAKE ? '' : stake)
  const [problem, setProblem] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: updateStake,
    onSuccess: async () => {
      setOpen(false)
      setProblem(null)
      // A temporada é lida por quatro telas sob a mesma chave; invalidar uma vez atualiza
      // todas em vez de cada uma mostrar a aposta velha até ser remontada.
      await queryClient.invalidateQueries({ queryKey: ['season'] })
    },
    onError: (error) => setProblem(getApiErrorMessage(error, t('season.stakeSaveError'))),
  })

  // Uma aposta é um acordo entre duas pessoas. Sozinho, seria um bilhete para si mesmo.
  if (!hasPartner) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost mt-2 w-full justify-center text-[13px]"
      >
        {t('season.stakeEdit')}
      </button>
    )
  }

  function submit() {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      // O servidor recusa com @NotBlank. Mandar e levar 400 faria a tela dizer "não consegui
      // salvar" sobre algo que ela já sabia estar errado.
      setProblem(t('season.stakeRequired'))
      return
    }
    save.mutate(trimmed)
  }

  return (
    <div className="mt-3 space-y-2">
      {/* O Field cuida do id, do rótulo e do aria-describedby; o erro vai nele, e não num
          parágrafo solto, para o leitor de tela anunciá-lo junto com o campo. */}
      <Field
        label={t('season.stakeLabel')}
        hint={t('season.stakeHint')}
        error={problem ?? undefined}
      >
        {(field) => (
          <input
            {...field}
            className="input"
            value={value}
            maxLength={255}
            placeholder={t('season.stakePlaceholder')}
            onChange={(e) => {
              setValue(e.target.value)
              setProblem(null)
            }}
          />
        )}
      </Field>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending}
          className="btn-primary flex-1 justify-center text-[13px]"
        >
          {t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setProblem(null)
          }}
          className="btn-ghost flex-1 justify-center text-[13px]"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
