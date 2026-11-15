package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.request.LoginRequest;
import br.edu.ifsp.karaoke.dto.request.VisitanteRequest;
import br.edu.ifsp.karaoke.dto.response.TokenResponse;
import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.model.TipoPerfil;
import br.edu.ifsp.karaoke.model.UsuarioModel;
import br.edu.ifsp.karaoke.repository.UsuarioRepository;
import br.edu.ifsp.karaoke.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutenticacaoService {

    private final UsuarioRepository usuarioRepository;
    private final SessaoService sessaoService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ProfanidadeService profanidadeService;

    public AutenticacaoService(UsuarioRepository usuarioRepository,
                               SessaoService sessaoService,
                               PasswordEncoder passwordEncoder,
                               JwtService jwtService,
                               ProfanidadeService profanidadeService) {
        this.usuarioRepository = usuarioRepository;
        this.sessaoService = sessaoService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.profanidadeService = profanidadeService;
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        UsuarioModel admin = usuarioRepository.findByEmailIgnoreCase(request.email().strip())
                .filter(UsuarioModel::isAdmin)
                .filter(usuario -> usuario.getSenhaHash() != null
                        && passwordEncoder.matches(request.senha(), usuario.getSenhaHash()))
                .orElseThrow(() -> new RegraNegocioException(CodigoErro.CREDENCIAIS_INVALIDAS,
                        "E-mail ou senha inválidos."));
        return resposta(admin, null);
    }

    @Transactional
    public TokenResponse visitante(VisitanteRequest request) {
        var sessao = sessaoService.buscarAbertaPorCodigo(request.codigoSessao())
                .orElseThrow(() -> new RegraNegocioException(CodigoErro.SESSAO_NAO_ENCONTRADA,
                        "Não existe uma sessão aberta com este código."));
        String nome = request.nome().strip().replaceAll("\\s+", " ");
        profanidadeService.validar(nome);
        UsuarioModel visitante = usuarioRepository.save(UsuarioModel.visitante(nome));
        return resposta(visitante, sessao.id());
    }

    private TokenResponse resposta(UsuarioModel usuario, String idSessao) {
        JwtService.TokenEmitido token = jwtService.emitir(usuario, idSessao);
        return new TokenResponse(token.valor(), "Bearer", token.expiraEm(), usuario.getIdUsuario(),
                usuario.getNome(), usuario.getTipoPerfil());
    }
}
