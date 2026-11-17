package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class ProfanidadeService {

    private static final List<String> BLOQUEADAS = List.of(
            "buceta", "caralho", "cuzao", "foda", "foder", "merda", "porra", "puta", "puto", "viado");

    private static final List<String> FRASES_BLOQUEADAS = List.of(
            "pau no cu", "tomar no cu", "vai se foder");

    private final Pattern bloqueio;

    public ProfanidadeService() {
        String palavras = String.join("|", BLOQUEADAS.stream().map(Pattern::quote).toList());
        String frases = String.join("|", FRASES_BLOQUEADAS.stream().map(Pattern::quote).toList());
        this.bloqueio = Pattern.compile("(?:\\b(?:" + palavras + ")\\b)|(?:" + frases + ")");
    }

    public void validar(String nome) {
        if (bloqueio.matcher(normalizar(nome)).find()) {
            throw new RegraNegocioException(CodigoErro.NOME_INADEQUADO,
                    "Escolha outro nome para a chamada ao palco.");
        }
    }

    String normalizar(String valor) {
        String semAcentos = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('0', 'o')
                .replace('1', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('5', 's')
                .replace('7', 't');
        return semAcentos.replaceAll("[^a-z]+", " ").strip().replaceAll("\\s+", " ");
    }
}
