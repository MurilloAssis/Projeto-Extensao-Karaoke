package br.edu.ifsp.karaoke.controller;

import br.edu.ifsp.karaoke.dto.request.PedidoRequest;
import br.edu.ifsp.karaoke.dto.response.FilaResponse;
import br.edu.ifsp.karaoke.dto.response.ItemFilaResponse;
import br.edu.ifsp.karaoke.security.UsuarioAutenticado;
import br.edu.ifsp.karaoke.service.ConsultaFilaService;
import br.edu.ifsp.karaoke.service.ControleFilaService;
import br.edu.ifsp.karaoke.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/fila")
public class FilaController {

    private final PedidoService pedidoService;
    private final ControleFilaService controleFilaService;
    private final ConsultaFilaService consultaFilaService;

    public FilaController(PedidoService pedidoService,
                          ControleFilaService controleFilaService,
                          ConsultaFilaService consultaFilaService) {
        this.pedidoService = pedidoService;
        this.controleFilaService = controleFilaService;
        this.consultaFilaService = consultaFilaService;
    }

    @PostMapping
    public ResponseEntity<ItemFilaResponse> solicitar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                      @Valid @RequestBody PedidoRequest pedido) {
        ItemFilaResponse criado = pedidoService.solicitar(usuario.idUsuario(), pedido);
        return ResponseEntity.created(URI.create("/api/fila/" + criado.idFila())).body(criado);
    }

    @GetMapping
    public FilaResponse fila() {
        return consultaFilaService.visao(false);
    }

    @GetMapping("/atual")
    public ResponseEntity<ItemFilaResponse> atual() {
        return consultaFilaService.atual()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/meus-pedidos")
    public List<ItemFilaResponse> meusPedidos(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return consultaFilaService.meusPedidos(usuario.idUsuario());
    }

    @GetMapping("/admin")
    public FilaResponse filaAdmin() {
        return consultaFilaService.visao(true);
    }

    @PostMapping("/play")
    public FilaResponse play(@AuthenticationPrincipal UsuarioAutenticado admin) {
        controleFilaService.play(autor(admin));
        return consultaFilaService.visao(true);
    }

    @PostMapping("/proxima")
    public FilaResponse proxima(@AuthenticationPrincipal UsuarioAutenticado admin) {
        controleFilaService.proxima(autor(admin));
        return consultaFilaService.visao(true);
    }

    @DeleteMapping("/{idFila}")
    public ResponseEntity<Void> remover(@AuthenticationPrincipal UsuarioAutenticado admin,
                                        @PathVariable Integer idFila) {
        controleFilaService.remover(idFila, autor(admin));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> limpar(@AuthenticationPrincipal UsuarioAutenticado admin) {
        controleFilaService.limpar(autor(admin));
        return ResponseEntity.noContent().build();
    }

    private static String autor(UsuarioAutenticado admin) {
        return "admin " + admin.idUsuario();
    }
}
