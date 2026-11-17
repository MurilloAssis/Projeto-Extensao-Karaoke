package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfanidadeServiceTest {

    private final ProfanidadeService servico = new ProfanidadeService();

    @ParameterizedTest
    @ValueSource(strings = {"Caralho", "P0RRA", "Vai se foder", "João Cuzão"})
    void bloqueiaNomesOfensivosEVariacoes(String nome) {
        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> servico.validar(nome));
        assertEquals(CodigoErro.NOME_INADEQUADO, erro.getCodigo());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Ana", "João da Silva", "Putumayo", "Meridian"})
    void aceitaNomesLegitimos(String nome) {
        assertDoesNotThrow(() -> servico.validar(nome));
    }

    @Test
    void normalizaAcentosEspacosELeetspeak() {
        assertEquals("joao cuzao", servico.normalizar("  João   Cuzã0 "));
    }
}
