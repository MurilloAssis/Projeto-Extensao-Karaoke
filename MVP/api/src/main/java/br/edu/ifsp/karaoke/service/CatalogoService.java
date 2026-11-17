package br.edu.ifsp.karaoke.service;

import br.edu.ifsp.karaoke.model.MusicaModel;
import br.edu.ifsp.karaoke.repository.MusicaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class CatalogoService {

    private final MusicaRepository musicaRepository;
    private final TransactionTemplate transacao;

    public CatalogoService(MusicaRepository musicaRepository, PlatformTransactionManager transactionManager) {
        this.musicaRepository = musicaRepository;
        this.transacao = new TransactionTemplate(transactionManager);
    }

    /** RN00: a música escolhida que ainda não está no catálogo é cadastrada automaticamente. */
    public Integer obterOuCadastrar(String youtubeId, String titulo) {
        return musicaRepository.findByYoutubeId(youtubeId)
                .map(MusicaModel::getIdMusica)
                .orElseGet(() -> cadastrar(youtubeId, titulo));
    }

    private Integer cadastrar(String youtubeId, String titulo) {
        try {
            return transacao.execute(s ->
                    musicaRepository.saveAndFlush(new MusicaModel(youtubeId, titulo)).getIdMusica());
        } catch (DataIntegrityViolationException e) {
            // Outro pedido cadastrou a mesma música ao mesmo tempo.
            return musicaRepository.findByYoutubeId(youtubeId)
                    .map(MusicaModel::getIdMusica)
                    .orElseThrow(() -> e);
        }
    }
}
