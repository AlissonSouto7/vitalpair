package com.aps.vitalpair.nutrition.domain.port.out;

import java.util.List;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

/**
 * Os alimentos que o próprio aplicativo conhece, sem consultar ninguém.
 *
 * <p>Uma porta, e não uma chamada direta à classe que lê o arquivo, porque de onde vêm esses
 * alimentos é decisão de infraestrutura: hoje um CSV embarcado, amanhã uma tabela ou um
 * serviço. O serviço de aplicação só precisa saber que existe um lugar que responde "quais
 * alimentos casam com isto".
 */
public interface FoodCatalogPort {

    /**
     * Os alimentos que casam com o termo, melhores primeiro.
     *
     * @param limit quantos no máximo. Quem chama decide, porque é a tela que sabe quantos
     *     cabem antes de a pessoa ter de rolar.
     */
    List<FoodProduct> search(String query, int limit);
}
