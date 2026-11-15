package br.edu.ifsp.karaoke.controller;

import br.edu.ifsp.karaoke.dto.request.LoginRequest;
import br.edu.ifsp.karaoke.dto.request.VisitanteRequest;
import br.edu.ifsp.karaoke.dto.response.TokenResponse;
import br.edu.ifsp.karaoke.service.AutenticacaoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AutenticacaoService autenticacaoService;

    public AuthController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return autenticacaoService.login(request);
    }

    @PostMapping("/visitante")
    public TokenResponse visitante(@Valid @RequestBody VisitanteRequest request) {
        return autenticacaoService.visitante(request);
    }
}
