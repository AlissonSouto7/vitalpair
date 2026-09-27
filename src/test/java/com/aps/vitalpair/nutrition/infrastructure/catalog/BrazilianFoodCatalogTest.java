package com.aps.vitalpair.nutrition.infrastructure.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

/**
 * O catálogo de alimentos brasileiros, que é a resposta ao que a busca devolvia.
 *
 * <p>Medido contra a API real da Open Food Facts em 27/09/2026: "frango" trazia "Mint
 * Chocolates" duas vezes e um item chamado "Comida"; "ovo" trazia "Quorn Schnitzel" e
 * espinafre. Os testes abaixo usam os mesmos termos, agora exigindo comida de verdade.
 */
class BrazilianFoodCatalogTest {

    private BrazilianFoodCatalog catalog;

    @BeforeEach
    void setUp() {
        catalog = new BrazilianFoodCatalog();
        catalog.load();
    }

    private List<String> nomes(String termo) {
        return catalog.search(termo, 6).stream().map(FoodProduct::name).toList();
    }

    @Test
    void carregaOarquivoDoCatalogo() {
        // Sem isto, todos os outros testes passariam vazios se o arquivo sumisse do jar.
        assertThat(catalog.size()).isGreaterThan(100);
    }

    @Test
    void buscarFrangoDevolveFrango() {
        List<String> r = nomes("frango");

        assertThat(r).isNotEmpty();
        // O defeito original era este: nenhum resultado tinha a ver com o que foi digitado.
        assertThat(r).allSatisfy(nome -> assertThat(nome.toLowerCase()).contains("frango"));
    }

    @Test
    void oFrangoGrelhadoVemAntesDoStrogonoff() {
        List<String> r = nomes("frango");

        // Quem digita "frango" quer o alimento, não o prato pronto que o contém. As duas
        // linhas casam com a palavra; a ordem é o que torna a lista útil.
        assertThat(r.indexOf("Peito de frango grelhado")).isLessThan(r.indexOf("Strogonoff de frango"));
    }

    @Test
    void buscarOvoDevolveOvo() {
        List<String> r = nomes("ovo");

        assertThat(r).isNotEmpty();
        assertThat(r).allSatisfy(nome -> assertThat(nome.toLowerCase()).contains("ovo"));
    }

    @Test
    void acharSemAcentoEhOcaminhoNormalNoCelular() {
        /*
         * Alimentos escolhidos por NÃO terem apelido na coluna de busca.
         *
         * A primeira versão deste teste usava "feijao", "maca" e "cafe", que estão escritos
         * como apelido no arquivo: ele passava pelo apelido e continuava passando com a
         * normalização de acento desligada, ou seja, não provava nada. Estes só acham se o
         * acento do nome for removido dos dois lados da comparação.
         */
        assertThat(nomes("salmao")).contains("Salmão grelhado");
        assertThat(nomes("camarao")).contains("Camarão cozido");
        assertThat(nomes("pao de queijo")).contains("Pão de queijo");
    }

    @Test
    void oAlimentoSimplesVemAntesDoPratoComposto() {
        List<String> r = nomes("arroz");

        // "Arroz branco cozido" antes de "Arroz carreteiro": um começa com o termo, o outro
        // só o contém, e começar vale mais.
        assertThat(r.get(0)).isEqualTo("Arroz branco cozido");
        assertThat(r.indexOf("Arroz branco cozido")).isLessThan(r.indexOf("Arroz carreteiro"));
    }

    @Test
    void oNomeExatoGanhaDeQuemSoComecaIgual() {
        /*
         * "maca" é a maçã, não o macarrão.
         *
         * Os dois começam com as mesmas quatro letras, e a ordem do arquivo põe o macarrão
         * antes. Sem a pontuação do casamento exato, buscar a fruta devolvia massa, que é o
         * mesmo tipo de resposta errada que fez esta tela ser reclamada: a lista ignora o
         * que foi digitado.
         *
         * Este é também o teste que mede a pontuação em vez da ordem do arquivo: os outros
         * de ordem passavam mesmo com todos os casamentos valendo igual.
         */
        List<String> r = nomes("maca");

        assertThat(r.get(0)).isEqualTo("Maçã");
    }

    @Test
    void entreEmpatadosValeAordemDoArquivo() {
        List<String> r = nomes("ovo");

        /*
         * "Ovo cozido", "Ovo frito" e "Ovo mexido" casam igualmente bem: os três começam com
         * o termo. O desempate era o tamanho do nome, que punha o frito na frente por ter uma
         * letra a menos, o que não diz nada sobre o que a pessoa quis. A ordem do arquivo é
         * editorial: alguém escolheu listar o mais comum primeiro.
         *
         * A primeira versão deste teste usava "arroz", onde a ordem do arquivo e a ordem por
         * tamanho concordam, então ele passava com o desempate desligado e não provava nada.
         */
        assertThat(r.get(0)).isEqualTo("Ovo cozido");
    }

    @Test
    void osApelidosDaBuscaTambemAcham() {
        // A coluna de busca existe para o que a pessoa digita e não está no nome.
        assertThat(nomes("aipim")).contains("Mandioca cozida");
        assertThat(nomes("massa")).contains("Macarrão cozido");
        assertThat(nomes("beiju")).contains("Tapioca");
    }

    @Test
    void osValoresSaoOsDaTabelaEnaoZeros() {
        FoodProduct frango = catalog.search("peito de frango", 1).get(0);

        // Um catálogo que devolvesse zeros seria pior que não existir: o diário registraria
        // refeições afirmando que o frango não tem calorias.
        assertThat(frango.caloriesPer100g().intValue()).isEqualTo(159);
        assertThat(frango.proteinPer100g().intValue()).isEqualTo(32);
    }

    @Test
    void naoDevolveNadaParaUmaLetraSo() {
        // Uma letra casa com meio catálogo e não diz nada sobre a intenção de quem digitou.
        assertThat(catalog.search("a", 6)).isEmpty();
        assertThat(catalog.search("", 6)).isEmpty();
    }

    @Test
    void naoInventaResultadoParaOqueNaoTem() {
        // Sem isto, um casamento frouxo demais faria o catálogo responder qualquer coisa e
        // esconder os produtos de marca que a Open Food Facts traria.
        assertThat(catalog.search("nescau", 6)).isEmpty();
        assertThat(catalog.search("xyzabc", 6)).isEmpty();
    }

    @Test
    void oLimitePedidoEhRespeitado() {
        assertThat(catalog.search("a", 3)).hasSizeLessThanOrEqualTo(3);
        assertThat(catalog.search("arroz", 2)).hasSizeLessThanOrEqualTo(2);
    }
}
