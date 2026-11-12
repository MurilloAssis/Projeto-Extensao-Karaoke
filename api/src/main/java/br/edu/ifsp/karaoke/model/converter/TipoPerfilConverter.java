package br.edu.ifsp.karaoke.model.converter;

import br.edu.ifsp.karaoke.model.TipoPerfil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TipoPerfilConverter implements AttributeConverter<TipoPerfil, String> {

    @Override
    public String convertToDatabaseColumn(TipoPerfil perfil) {
        return perfil == null ? null : perfil.getValor();
    }

    @Override
    public TipoPerfil convertToEntityAttribute(String valor) {
        return valor == null ? null : TipoPerfil.deValor(valor);
    }
}
