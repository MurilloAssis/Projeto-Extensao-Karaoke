package br.edu.ifsp.karaoke.exception;

public class RegraNegocioException extends RuntimeException {

    private final CodigoErro codigo;

    public RegraNegocioException(CodigoErro codigo, String detalhe) {
        super(detalhe);
        this.codigo = codigo;
    }

    public CodigoErro getCodigo() {
        return codigo;
    }
}
