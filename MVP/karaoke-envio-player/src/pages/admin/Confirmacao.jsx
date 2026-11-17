import { Trash2 } from 'lucide-react';
import { cores, estilos } from './estilosAdmin';

export function Confirmacao({ titulo, descricao, textoConfirmar, ocupado, onConfirmar, onCancelar, Icone = Trash2 }) {
  return (
    <div style={estilos.modalBackdrop} onClick={ocupado ? undefined : onCancelar}>
      <div
        style={estilos.bottomSheet}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={estilos.sheetHandle} />
        <div style={estilos.sheetTitleGroup}>
          <div style={estilos.micBadge}>
            <Icone size={15} color={cores.vermelho} />
          </div>
          <h3 style={estilos.sheetTitle}>{titulo}</h3>
        </div>
        <p style={estilos.sheetText}>{descricao}</p>
        <div style={estilos.sheetButtons}>
          <button type="button" style={estilos.btnCancel} onClick={onCancelar} disabled={ocupado}>
            Cancelar
          </button>
          <button
            type="button"
            style={{ ...estilos.btnConfirm, ...(ocupado ? { opacity: 0.6, cursor: 'wait' } : {}) }}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            <Icone size={14} />
            <span>{ocupado ? 'Aguarde…' : textoConfirmar}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
