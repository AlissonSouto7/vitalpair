package com.aps.vitalpair.nutrition.domain.model;

/**
 * A família de um alimento, para a tela poder mostrar de que tipo de comida se trata.
 *
 * <p>Existe porque uma lista de resultados só com nome e caloria faz a pessoa ler oito linhas
 * de texto parecido para achar a sua. Uma palavra e um ícone por linha resolvem a triagem antes
 * da leitura: quem busca "frango" reconhece a carne de longe.
 *
 * <p>Enum e não texto livre: a tela escolhe um ícone por família, e um valor novo inventado no
 * arquivo do catálogo apareceria como um espaço vazio no lugar do desenho. Aqui, um valor
 * desconhecido nem carrega.
 *
 * <p>{@link #OTHER} é para o que vem da Open Food Facts, onde o produto é de marca e a
 * categoria deles não corresponde a estas: dizer "outros" é honesto, inventar uma família a
 * partir do nome do produto não é.
 */
public enum FoodCategory {
    /** Arroz, feijão, macarrão, mandioca: a base do prato. */
    STAPLE,

    /** Carne, ovo, peixe. */
    PROTEIN,

    /** Pão, biscoito, cereal, o café da manhã. */
    BREAD,

    /** Leite, queijo, iogurte. */
    DAIRY,

    /** Fruta. */
    FRUIT,

    /** Legume, verdura, salada. */
    VEGETABLE,

    /** Lanche, doce, bebida. */
    TREAT,

    /** Prato pronto: feijoada, strogonoff, lasanha. */
    DISH,

    /** Suplemento: whey, creatina. */
    SUPPLEMENT,

    /** Sem família conhecida. É o caso de todo produto de marca da Open Food Facts. */
    OTHER
}
