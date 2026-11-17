import { useState } from 'react';
import { Disc3 } from 'lucide-react';
import { cores, estilos } from './estilosAdmin';

export function Miniatura({ youtubeId, titulo }) {
  const [idComFalha, setIdComFalha] = useState(null);

  if (!youtubeId || idComFalha === youtubeId) {
    return (
      <div style={estilos.trackThumbVazio}>
        <Disc3 size={20} color={cores.secundario} />
      </div>
    );
  }

  return (
    <img
      src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
      alt={titulo}
      style={estilos.trackThumb}
      onError={() => setIdComFalha(youtubeId)}
    />
  );
}
