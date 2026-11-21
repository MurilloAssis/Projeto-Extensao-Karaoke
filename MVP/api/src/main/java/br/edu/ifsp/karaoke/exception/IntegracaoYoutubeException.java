package br.edu.ifsp.karaoke.exception;

public class IntegracaoYoutubeException extends RuntimeException {

    public IntegracaoYoutubeException(String message) {
        super(message);
    }

    public IntegracaoYoutubeException(String message, Throwable cause) {
        super(message, cause);
    }
}
