import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { getApiErrorMessage, getFieldErrors, getRequestId, getStatus } from './errors'

/** An AxiosError shaped like a real response from this API. */
function apiError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('request failed')
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  }
  return error
}

describe('getApiErrorMessage', () => {
  it('prefers the message the server sent', () => {
    const error = apiError(422, { success: false, message: 'E-mail já cadastrado' })

    expect(getApiErrorMessage(error, 'fallback')).toBe('E-mail já cadastrado')
  })

  it('falls back when the server sent no message', () => {
    expect(getApiErrorMessage(apiError(500, { success: false }), 'Algo deu errado')).toBe(
      'Algo deu errado',
    )
  })

  it('falls back for anything that is not an API error', () => {
    // A network failure has no response at all, and a thrown string is not an AxiosError.
    expect(getApiErrorMessage(new Error('offline'), 'Sem conexão')).toBe('Sem conexão')
    expect(getApiErrorMessage('boom', 'Sem conexão')).toBe('Sem conexão')
  })

  it('replaces the generic validation message with the caller fallback', () => {
    // "Erro de validação" tells a person nothing about which field is wrong, so a page
    // with a specific message shows that instead. Only the onboarding flow used to do
    // this; centralising the helper gave every page the same behaviour.
    const error = apiError(400, { success: false, message: 'Erro de validação' })

    expect(getApiErrorMessage(error, 'Confere a data de nascimento')).toBe(
      'Confere a data de nascimento',
    )
  })
})

describe('getFieldErrors', () => {
  it('maps violations by field so a form can show them next to the input', () => {
    const error = apiError(400, {
      success: false,
      message: 'Erro de validação',
      data: {
        violations: [
          { field: 'email', message: 'deve ser um e-mail válido' },
          { field: 'password', message: 'tamanho deve ser entre 8 e 100' },
        ],
      },
    })

    expect(getFieldErrors(error)).toEqual({
      email: 'deve ser um e-mail válido',
      password: 'tamanho deve ser entre 8 e 100',
    })
  })

  it('is empty when the error carries no violations', () => {
    expect(getFieldErrors(apiError(500, { success: false }))).toEqual({})
    expect(getFieldErrors(new Error('offline'))).toEqual({})
  })
})

describe('getRequestId', () => {
  it('reads the id the server put in the error body', () => {
    const error = apiError(500, {
      success: false,
      message: 'Erro interno inesperado',
      data: { requestId: 'abc-123' },
    })

    expect(getRequestId(error)).toBe('abc-123')
  })

  it('is null when there is none', () => {
    expect(getRequestId(apiError(404, { success: false }))).toBeNull()
    expect(getRequestId(new Error('offline'))).toBeNull()
  })
})

describe('getStatus', () => {
  it('reports the HTTP status, and null when the request never got a response', () => {
    expect(getStatus(apiError(429, {}))).toBe(429)
    expect(getStatus(new AxiosError('network error'))).toBeNull()
    expect(getStatus('boom')).toBeNull()
  })
})
