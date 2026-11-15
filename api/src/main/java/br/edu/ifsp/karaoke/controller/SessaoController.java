package br.edu.ifsp.karaoke.controller;

import br.edu.ifsp.karaoke.dto.response.SessaoResponse;
import br.edu.ifsp.karaoke.security.UsuarioAutenticado;
import br.edu.ifsp.karaoke.service.SessaoService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessoes")
public class SessaoController {

    private final SessaoService sessaoService;

    public SessaoController(SessaoService sessaoService) {
        this.sessaoService = sessaoService;
    }

    @PostMapping
    public SessaoResponse abrir(@AuthenticationPrincipal UsuarioAutenticado admin) {
        return sessaoService.abrir(admin.idUsuario());
    }

    @PostMapping("/{idSessao}/encerrar")
    public SessaoResponse encerrar(@PathVariable String idSessao) {
        return sessaoService.encerrar(idSessao);
    }
}
