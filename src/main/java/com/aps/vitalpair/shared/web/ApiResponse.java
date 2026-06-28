package com.aps.vitalpair.shared.web;

/**
 * Envelope padrão de toda resposta da API.
 *
 * @param success indica se a operação foi bem-sucedida
 * @param message mensagem opcional para o cliente (erro ou informação)
 * @param data    payload da resposta (nulo em erros)
 */
public record ApiResponse<T>(boolean success, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static <T> ApiResponse<T> fail(String message, T data) {
        return new ApiResponse<>(false, message, data);
    }
}
