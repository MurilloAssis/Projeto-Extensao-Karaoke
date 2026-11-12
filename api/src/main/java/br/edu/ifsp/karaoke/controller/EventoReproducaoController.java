package br.edu.ifsp.karaoke.controller;

import br.edu.ifsp.karaoke.dto.response.FilaResponse;
import br.edu.ifsp.karaoke.service.ConsultaFilaService;
import br.edu.ifsp.karaoke.service.ControleFilaService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/** IEventoReproducao: o Karaokê TV Player avisa o término do vídeo. */
@RestController
public class EventoReproducaoController {

    private final ControleFilaService controleFilaService;
    private final ConsultaFilaService consultaFilaService;

    public EventoReproducaoController(ControleFilaService controleFilaService,
                                      ConsultaFilaService consultaFilaService) {
        this.controleFilaService = controleFilaService;
        this.consultaFilaService = consultaFilaService;
    }

    @PostMapping("/api/fila/{idFila}/concluir")
    public FilaResponse concluir(@PathVariable Integer idFila) {
        controleFilaService.concluir(idFila, "reprodutor");
        return consultaFilaService.visao(false);
    }
}
