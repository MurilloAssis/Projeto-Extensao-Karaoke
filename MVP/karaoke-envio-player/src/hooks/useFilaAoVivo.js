import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

// Sem VITE_WS_URL, usa o próprio endereço da página (ws:// ou wss://), repassado à API pelo proxy do Vite.
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
const TOPICO = '/topic/fila-atualizada';
const TOPICO_SESSAO = '/topic/sessao-atualizada';

/**
 * Mantém a fila atualizada: carrega por HTTP e recarrega a cada aviso `fila-atualizada`.
 * `carregar` busca a visão desejada (ex.: filaApi.admin); `aoReceber` recebe cada aviso novo.
 * `aoSessao` é chamado ao conectar e a cada `sessao-atualizada`; esse aviso também recarrega a fila
 * (o cliente perde o acesso quando a sessão encerra).
 */
export function useFilaAoVivo(carregar, { aoReceber, aoSessao } = {}) {
  const [fila, setFila] = useState(null);
  const [erroCarga, setErroCarga] = useState(null);
  const [conectado, setConectado] = useState(false);

  const carregarRef = useRef(carregar);
  const aoReceberRef = useRef(aoReceber);
  const aoSessaoRef = useRef(aoSessao);
  const ultimaLeitura = useRef(0);

  useEffect(() => {
    carregarRef.current = carregar;
    aoReceberRef.current = aoReceber;
    aoSessaoRef.current = aoSessao;
  });

  const recarregar = useCallback(async () => {
    const leitura = ++ultimaLeitura.current;
    try {
      const dados = await carregarRef.current();
      if (leitura === ultimaLeitura.current) {
        setFila(dados);
        setErroCarga(null);
      }
    } catch (erro) {
      if (leitura === ultimaLeitura.current) setErroCarga(erro);
    }
  }, []);

  // Estado devolvido por uma ação (Play, Próxima…): descarta leituras ainda em andamento.
  const aplicar = useCallback((dados) => {
    ultimaLeitura.current++;
    setFila(dados);
    setErroCarga(null);
  }, []);

  useEffect(() => {
    let ultimaVersao = 0;
    const cliente = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    cliente.onConnect = () => {
      ultimaVersao = 0; // a API pode ter reiniciado e o contador recomeça
      setConectado(true);
      cliente.subscribe(TOPICO, (frame) => {
        let mensagem;
        try {
          mensagem = JSON.parse(frame.body);
        } catch {
          return;
        }
        if (mensagem.versao <= ultimaVersao) return;
        ultimaVersao = mensagem.versao;
        aoReceberRef.current?.(mensagem);
        recarregar();
      });
      cliente.subscribe(TOPICO_SESSAO, () => {
        aoSessaoRef.current?.();
        recarregar();
      });
      aoSessaoRef.current?.();
      recarregar();
    };
    cliente.onWebSocketClose = () => setConectado(false);
    cliente.onStompError = () => setConectado(false);

    cliente.activate();
    aoSessaoRef.current?.();
    recarregar();

    return () => {
      cliente.deactivate();
    };
  }, [recarregar]);

  return { fila, erroCarga, conectado, recarregar, aplicar };
}
