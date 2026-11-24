package br.edu.ifsp.karaoke.controller;

import br.edu.ifsp.karaoke.dto.response.MusicaResponse;
import br.edu.ifsp.karaoke.dto.response.PaginaResponse;
import br.edu.ifsp.karaoke.service.SugestaoMusicaService;
import br.edu.ifsp.karaoke.service.BuscaMusicaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/musicas")
public class MusicaController {

    private final SugestaoMusicaService sugestaoMusicaService;
    private final BuscaMusicaService buscaMusicaService;

    public MusicaController(SugestaoMusicaService sugestaoMusicaService,
                            BuscaMusicaService buscaMusicaService) {
        this.sugestaoMusicaService = sugestaoMusicaService;
        this.buscaMusicaService = buscaMusicaService;
    }

    /** Músicas sugeridas (catálogo cadastrado), filtradas pelo que o cliente digita, em páginas. */
    @GetMapping
    public PaginaResponse<MusicaResponse> sugestoes(
            @RequestParam(name = "q", required = false) String termo,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "" + SugestaoMusicaService.TAMANHO_PADRAO) int tamanho) {
        return sugestaoMusicaService.buscar(termo, pagina, tamanho);
    }

    /** Cache-first: consulta o catálogo e só pesquisa no YouTube quando não houver resultado local. */
    @GetMapping("/busca")
    public List<MusicaResponse> buscar(@RequestParam("q") String termo) {
        return buscaMusicaService.buscar(termo);
    }
}
