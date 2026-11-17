package br.edu.ifsp.karaoke.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Uma página de resultados; {@code pagina} começa em 0. */
public record PaginaResponse<T>(List<T> itens, int pagina, int tamanho, long total, boolean temMais) {

    public static <E, T> PaginaResponse<T> de(Page<E> pagina, Function<E, T> conversor) {
        return new PaginaResponse<>(pagina.getContent().stream().map(conversor).toList(),
                pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.hasNext());
    }
}
