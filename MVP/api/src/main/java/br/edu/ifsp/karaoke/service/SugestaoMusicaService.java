package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.response.MusicaResponse;
import br.edu.ifsp.karaoke.dto.response.PaginaResponse;
import br.edu.ifsp.karaoke.repository.MusicaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Músicas sugeridas ao cliente a partir do catálogo já cadastrado (até a busca no YouTube, card 2.1). */
@Service
@Transactional(readOnly = true)
public class SugestaoMusicaService {

    public static final int TAMANHO_PADRAO = 20;
    public static final int TAMANHO_MAXIMO = 50;
    private static final int TERMO_MAXIMO = 100;
    private static final Sort ORDEM = Sort.by("titulo", "idMusica");

    private final MusicaRepository musicaRepository;

    public SugestaoMusicaService(MusicaRepository musicaRepository) {
        this.musicaRepository = musicaRepository;
    }

    /** Valores fora da faixa são ajustados (página negativa vira 0; tamanho fica entre 1 e 50). */
    public PaginaResponse<MusicaResponse> buscar(String termo, int pagina, int tamanho) {
        var pedido = PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, TAMANHO_MAXIMO), ORDEM);
        return PaginaResponse.de(musicaRepository.buscarSugestoes(padrao(termo), pedido), MusicaResponse::de);
    }

    /** "%termo%" com os curingas do próprio texto escapados (o cliente digita % ou _ literalmente). */
    static String padrao(String termo) {
        if (termo == null || termo.isBlank()) {
            return null;
        }
        String limpo = termo.strip().replaceAll("\\s+", " ");
        if (limpo.length() > TERMO_MAXIMO) {
            limpo = limpo.substring(0, TERMO_MAXIMO);
        }
        return "%" + limpo.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
}
