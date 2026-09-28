package com.aps.vitalpair.nutrition.infrastructure.catalog;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.nutrition.domain.model.FoodCategory;
import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import com.aps.vitalpair.nutrition.domain.port.out.FoodCatalogPort;

/**
 * Os alimentos que se comem no Brasil, carregados de um arquivo do próprio aplicativo.
 *
 * <p>Existe porque a busca só consultava a Open Food Facts, que cataloga produtos embalados de
 * marca do mundo inteiro. Medido em 27/09/2026 contra a API real: "frango" devolvia "Mint
 * Chocolates" duas vezes e um item chamado "Comida"; "ovo" devolvia "Quorn Schnitzel" e
 * espinafre. Não é defeito de ordenação, é ausência: arroz cozido e peito de frango grelhado
 * não existem naquele banco, porque ninguém os vende embalados com código de barras.
 *
 * <p>Em memória, e não numa tabela: são pouco mais de cem linhas que mudam quando alguém edita
 * o arquivo, nunca por ação de quem usa o aplicativo. Uma tabela pediria migração, consulta e
 * índice para dar a mesma resposta mais devagar. No dia em que este catálogo crescer a ponto
 * de a varredura linear pesar, a conta muda; hoje a lista inteira cabe numa busca que não
 * chega a um milissegundo.
 *
 * <p>Uma falha de leitura não derruba a aplicação: o catálogo fica vazio, a busca continua
 * respondendo com o que vem da Open Food Facts, e o log diz o que aconteceu. Perder o arquivo
 * é degradar a busca, não perder o aplicativo.
 */
@Component
public class BrazilianFoodCatalog implements FoodCatalogPort {

    private static final Logger log = LoggerFactory.getLogger(BrazilianFoodCatalog.class);

    private static final String ARQUIVO = "foods/br-foods.csv";

    /** A linha que abre uma seção e diz a família dos alimentos até a próxima. */
    private static final String DIRETIVA_CATEGORIA = "# categoria:";

    /** Um alimento do catálogo, já com os termos de busca normalizados. */
    private record Entry(FoodProduct food, String nomeNormalizado, List<String> termos) {}

    private List<Entry> entries = List.of();

    @PostConstruct
    void load() {
        List<Entry> lidos = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ClassPathResource(ARQUIVO).getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            // A família vale da diretiva até a próxima, então é estado da leitura do arquivo.
            FoodCategory categoria = FoodCategory.OTHER;
            while ((linha = reader.readLine()) != null) {
                if (linha.startsWith(DIRETIVA_CATEGORIA)) {
                    categoria = categoriaDe(linha);
                    continue;
                }
                // Comentários explicam a fonte e as escolhas; o cabeçalho nomeia as colunas.
                if (linha.isBlank() || linha.startsWith("#") || linha.startsWith("nome;")) {
                    continue;
                }
                parse(linha, categoria).ifPresent(lidos::add);
            }
        } catch (IOException e) {
            log.error(
                    "Não foi possível ler o catálogo de alimentos em {}: a busca vai usar só a Open Food" + " Facts",
                    ARQUIVO,
                    e);
            return;
        }
        entries = List.copyOf(lidos);
        log.info("Catálogo de alimentos carregado: {} itens", entries.size());
    }

    /**
     * A família declarada por uma diretiva de seção.
     *
     * <p>Um valor que não existe no enum vira {@link FoodCategory#OTHER} e um aviso, pela mesma
     * razão que uma linha torta não derruba a busca: um erro de digitação num arquivo de
     * catálogo não deve tirar o aplicativo do ar. O custo é uma seção sem ícone, visível na
     * tela e no log.
     */
    private static FoodCategory categoriaDe(String linha) {
        String valor = linha.substring(DIRETIVA_CATEGORIA.length()).trim();
        try {
            return FoodCategory.valueOf(valor.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            log.warn("Categoria desconhecida no catálogo de alimentos, os itens abaixo vão sem família: {}", valor);
            return FoodCategory.OTHER;
        }
    }

    private java.util.Optional<Entry> parse(String linha, FoodCategory categoria) {
        String[] c = linha.split(";", -1);
        if (c.length < 6) {
            // Uma linha torta é um erro de edição do arquivo, não do aplicativo: registra e
            // segue, em vez de derrubar a busca inteira por causa de um ponto e vírgula.
            log.warn("Linha ignorada no catálogo de alimentos, esperava 6 colunas: {}", linha);
            return java.util.Optional.empty();
        }
        try {
            String nome = c[0].trim();
            FoodProduct food = new FoodProduct(
                    nome,
                    // Sem código de barras: estes são alimentos, não produtos embalados.
                    null,
                    new BigDecimal(c[2].trim()),
                    new BigDecimal(c[3].trim()),
                    new BigDecimal(c[4].trim()),
                    new BigDecimal(c[5].trim()),
                    categoria);

            List<String> termos = new ArrayList<>();
            termos.add(normalize(nome));
            for (String extra : c[1].split(",|;")) {
                if (!extra.isBlank()) {
                    termos.add(normalize(extra));
                }
            }
            return java.util.Optional.of(new Entry(food, normalize(nome), List.copyOf(termos)));
        } catch (NumberFormatException e) {
            log.warn("Linha ignorada no catálogo de alimentos, número inválido: {}", linha);
            return java.util.Optional.empty();
        }
    }

    /**
     * Os alimentos que casam com o que foi digitado, melhores primeiro.
     *
     * <p>A ordem é o ponto: quem digita "frango" quer "Peito de frango grelhado" antes de
     * "Strogonoff de frango", e as duas contêm a palavra. Começar com o termo vale mais do que
     * contê-lo no meio, e entre dois empates vence o nome mais curto, que é o alimento mais
     * simples: "Arroz branco cozido" antes de "Arroz carreteiro".
     */
    @Override
    public List<FoodProduct> search(String query, int limit) {
        String alvo = normalize(query);
        if (alvo.length() < 2 || entries.isEmpty()) {
            return List.of();
        }
        return entries.stream()
                .map(e -> new Scored(e, score(e, alvo)))
                .filter(s -> s.score > 0)
                /*
                 * Só pela pontuação. Entre empatados, `sorted` é estável por especificação e
                 * preserva a ordem do fluxo, que é a do arquivo: "Ovo cozido" antes de "Ovo
                 * frito" porque alguém escolheu listar o mais comum primeiro, olhando comida.
                 *
                 * Havia aqui um desempate explícito pelo tamanho do nome. Ele era redundante
                 * (a estabilidade já dava o resultado) e estava errado: punha "Ovo frito" na
                 * frente por ter uma letra a menos, o que não diz nada sobre o que a pessoa
                 * quis.
                 */
                .sorted(Comparator.comparingInt((Scored s) -> -s.score))
                .limit(limit)
                .map(s -> s.entry.food())
                .toList();
    }

    private record Scored(Entry entry, int score) {}

    /** 0 quando não casa. Números maiores são respostas melhores; só a ordem entre eles importa. */
    private int score(Entry e, String alvo) {
        int melhor = 0;
        for (String termo : e.termos()) {
            if (termo.equals(alvo)) {
                melhor = Math.max(melhor, 100);
            } else if (termo.startsWith(alvo)) {
                melhor = Math.max(melhor, 80);
            } else if (termo.contains(" " + alvo)) {
                // Começo de outra palavra do nome: "frango" em "Peito de frango grelhado".
                melhor = Math.max(melhor, 60);
            } else if (termo.contains(alvo)) {
                melhor = Math.max(melhor, 30);
            }
        }
        return melhor;
    }

    /**
     * Minúsculas e sem acento, dos dois lados da comparação.
     *
     * <p>Ninguém digita "maçã" com cedilha e til no celular com pressa, e "feijao" tem de achar
     * "Feijão". Normalizar só a busca não bastaria: o acento está nos nomes do catálogo.
     */
    private static String normalize(String valor) {
        String semAcento =
                Normalizer.normalize(valor.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT);
    }

    /** Quantos alimentos o catálogo carregou. Usado por teste e pelo log de inicialização. */
    public int size() {
        return entries.size();
    }
}
