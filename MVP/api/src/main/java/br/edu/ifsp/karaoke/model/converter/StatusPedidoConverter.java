package br.edu.ifsp.karaoke.model.converter;

import br.edu.ifsp.karaoke.model.StatusPedido;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StatusPedidoConverter implements AttributeConverter<StatusPedido, String> {

    @Override
    public String convertToDatabaseColumn(StatusPedido status) {
        return status == null ? null : status.getValor();
    }

    @Override
    public StatusPedido convertToEntityAttribute(String valor) {
        return valor == null ? null : StatusPedido.deValor(valor);
    }
}
