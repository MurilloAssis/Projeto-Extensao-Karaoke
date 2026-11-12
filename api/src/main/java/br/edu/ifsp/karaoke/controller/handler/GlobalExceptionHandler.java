package br.edu.ifsp.karaoke.controller.handler;

import br.edu.ifsp.karaoke.exception.CodigoErro;
import br.edu.ifsp.karaoke.exception.RegraNegocioException;
import br.edu.ifsp.karaoke.exception.TransicaoInvalidaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/** Respostas de erro no formato ProblemDetail com o campo "codigo" (RF12). */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ProblemDetail> regraNegocio(RegraNegocioException e) {
        return resposta(e.getCodigo(), e.getMessage());
    }

    @ExceptionHandler(TransicaoInvalidaException.class)
    public ResponseEntity<ProblemDetail> transicaoInvalida(TransicaoInvalidaException e) {
        return resposta(CodigoErro.RN04_TRANSICAO_INVALIDA, e.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> naoIdentificado(AuthenticationException e) {
        return resposta(CodigoErro.NAO_IDENTIFICADO, "Identifique-se para continuar.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> acessoNegado(AccessDeniedException e) {
        return resposta(CodigoErro.RN03_ACESSO_NEGADO, "Seu perfil não tem permissão para esta operação.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> erroInesperado(Exception e) {
        log.error("Erro inesperado", e);
        return resposta(CodigoErro.ERRO_INTERNO, "Não foi possível concluir a operação.");
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException e, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : e.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        ProblemDetail problema = problema(CodigoErro.VALIDACAO, "Verifique os campos informados.");
        problema.setProperty("campos", campos);
        return ResponseEntity.badRequest().body(problema);
    }

    @Override
    protected ResponseEntity<Object> createResponseEntity(
            Object body, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        if (body instanceof ProblemDetail problema
                && (problema.getProperties() == null || !problema.getProperties().containsKey("codigo"))) {
            problema.setProperty("codigo", status.value() == 400 ? CodigoErro.VALIDACAO.name() : "ERRO_HTTP");
        }
        return super.createResponseEntity(body, headers, status, request);
    }

    private static ResponseEntity<ProblemDetail> resposta(CodigoErro codigo, String detalhe) {
        return ResponseEntity.status(codigo.getStatus()).body(problema(codigo, detalhe));
    }

    public static ProblemDetail problema(CodigoErro codigo, String detalhe) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(codigo.getStatus(), detalhe);
        problema.setTitle(codigo.getTitulo());
        problema.setProperty("codigo", codigo.name());
        return problema;
    }
}
