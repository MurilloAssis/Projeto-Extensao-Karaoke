package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.dto.response.FilaResponse;
import br.edu.ifsp.karaoke.dto.response.ItemFilaResponse;
import br.edu.ifsp.karaoke.model.FilaModel;
import br.edu.ifsp.karaoke.model.StatusPedido;
import br.edu.ifsp.karaoke.repository.FilaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ConsultaFilaService {

    private final FilaRepository filaRepository;

    public ConsultaFilaService(FilaRepository filaRepository) {
        this.filaRepository = filaRepository;
    }

    /** Tocando agora + próximos (RF06). O solicitante só aparece na visão do admin. */
    public FilaResponse visao(boolean admin) {
        ItemFilaResponse atual = null;
        List<ItemFilaResponse> proximos = new ArrayList<>();
        for (FilaModel pedido : filaRepository.buscarComDetalhes(StatusPedido.ATIVOS)) {
            if (pedido.getStatus() == StatusPedido.REPRODUZINDO) {
                atual = ItemFilaResponse.de(pedido, null, admin);
            } else {
                proximos.add(ItemFilaResponse.de(pedido, proximos.size() + 1, admin));
            }
        }
        return new FilaResponse(atual, proximos, proximos.size());
    }

    public Optional<ItemFilaResponse> atual() {
        return filaRepository.buscarComDetalhes(List.of(StatusPedido.REPRODUZINDO)).stream()
                .findFirst()
                .map(pedido -> ItemFilaResponse.de(pedido, null, false));
    }

    public List<ItemFilaResponse> meusPedidos(Integer idUsuario) {
        return filaRepository.buscarDoUsuario(idUsuario, StatusPedido.ATIVOS).stream()
                .map(this::itemPublico)
                .toList();
    }

    ItemFilaResponse itemPublico(FilaModel pedido) {
        Integer posicao = pedido.getStatus() == StatusPedido.NA_FILA
                ? (int) filaRepository.calcularPosicao(pedido.getDtPedido(), pedido.getIdFila())
                : null;
        return ItemFilaResponse.de(pedido, posicao, false);
    }
}
