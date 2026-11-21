package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.response.MusicaResponse;
import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.integration.youtube.YoutubeDataApiClient;
import br.edu.ifsp.karaoke.repository.MusicaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BuscaMusicaService {

    private static final String SUFIXO_KARAOKE = " karaoke";

    private final MusicaRepository musicaRepository;
    private final YoutubeDataApiClient youtube;
    private final CatalogoService catalogoService;

    public BuscaMusicaService(MusicaRepository musicaRepository,
                              YoutubeDataApiClient youtube,
                              CatalogoService catalogoService) {
        this.musicaRepository = musicaRepository;
        this.youtube = youtube;
        this.catalogoService = catalogoService;
    }

    public List<MusicaResponse> buscar(String termo) {
        String limpo = normalizar(termo);
        if (limpo == null) {
            throw new RegraNegocioException(CodigoErro.VALIDACAO, "Informe um termo para pesquisar músicas.");
        }

        var cache = musicaRepository.buscarNoCache(SugestaoMusicaService.padrao(limpo));
        if (!cache.isEmpty()) {
            return cache.stream()
                    .filter(musica -> musica.validarDisponibilidade())
                    .map(MusicaResponse::de)
                    .toList();
        }

        return youtube.buscar(limpo + SUFIXO_KARAOKE).stream()
                .map(video -> catalogoService.obterOuCadastrarMusica(video.videoId(), video.titulo()))
                .filter(musica -> musica.validarDisponibilidade())
                .map(MusicaResponse::de)
                .toList();
    }

    private static String normalizar(String termo) {
        if (termo == null || termo.isBlank()) {
            return null;
        }
        return termo.strip().replaceAll("\\s+", " ");
    }
}
