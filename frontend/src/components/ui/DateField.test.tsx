import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactElement, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import { DateField } from './DateField'

import i18n from '@/i18n'

/**
 * Um invólucro controlado, como os dois chamadores reais usam: o pai é dono da string ISO
 * e devolve o que recebeu.
 */
function Harness() {
  const [value, setValue] = useState('')
  return (
    <>
      <span id="birth">Nascimento</span>
      <DateField labelId="birth" value={value} onChange={setValue} />
      <output data-testid="iso">{value}</output>
    </>
  )
}

function renderIn(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

/**
 * O campo de data, que passou a ser o seletor nativo do aparelho.
 *
 * Eram três dropdowns feitos à mão. Medido num iPhone de 390px: cabiam 6 opções por vez, e
 * chegar em 1998 na lista de 120 anos custava 1044px de rolagem dentro de um popup de
 * 240px, com o dedo. Os dois testes que sumiram daqui cobriam uma data "pela metade" (dia
 * escolhido, mês ainda não), um estado que só existia porque eram três controles: com um
 * campo só, o navegador nunca emite uma data incompleta.
 */
describe('DateField', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt')
  })

  it('devolve a data em ISO, que é o formato que a API espera', async () => {
    const user = userEvent.setup()
    renderIn(<Harness />)

    await user.type(screen.getByLabelText('Nascimento'), '1995-05-15')

    expect(screen.getByTestId('iso')).toHaveTextContent('1995-05-15')
  })

  it('mostra a data que recebeu', () => {
    renderIn(
      <>
        <span id="b2">Nascimento</span>
        <DateField labelId="b2" value="1990-03-07" onChange={() => {}} />
      </>,
    )

    expect(screen.getByLabelText('Nascimento')).toHaveValue('1990-03-07')
  })

  it('segue o pai quando o pai troca a data', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [value, setValue] = useState('1995-05-15')
      return (
        <>
          <span id="b3">Nascimento</span>
          <DateField labelId="b3" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue('2000-01-02')}>
            carregar perfil
          </button>
        </>
      )
    }
    renderIn(<Controlled />)

    await user.click(screen.getByRole('button', { name: 'carregar perfil' }))

    // Carregar um perfil ou limpar o formulário tem que vencer o que está na tela.
    expect(screen.getByLabelText('Nascimento')).toHaveValue('2000-01-02')
  })

  it('não aceita uma data de nascimento no futuro', () => {
    renderIn(<Harness />)

    // O navegador recusa antes de o formulário precisar dizer qualquer coisa. Nascer
    // amanhã não é um caso de validação, é uma impossibilidade.
    const hoje = new Date().toISOString().slice(0, 10)
    expect(screen.getByLabelText('Nascimento')).toHaveAttribute('max', hoje)
  })

  it('é nomeado pelo rótulo do formulário', () => {
    renderIn(<Harness />)

    // Um `<label htmlFor>` apontando para um grupo não nomeava nada, porque um
    // `role="group"` não é um controle de formulário. Agora é um input de verdade.
    expect(screen.getByLabelText('Nascimento')).toBeInTheDocument()
  })

  it('usa o seletor de data do aparelho, e não uma lista feita à mão', () => {
    renderIn(<Harness />)

    // O ponto da mudança: quem decide como escolher a data é o sistema operacional, que no
    // celular abre a roleta nativa em vez de uma lista de 120 anos com scroll interno.
    expect(screen.getByLabelText('Nascimento')).toHaveAttribute('type', 'date')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
