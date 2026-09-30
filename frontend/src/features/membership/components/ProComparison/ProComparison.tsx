// Tabla comparativa Free vs Pro de la página Pro.
// Es presentacional y sin estado: solo dibuja la grilla de funciones.
//
// El precio llega por props y no está escrito acá: es un dato de negocio que
// vive en la tabla PLAN y lo trae quien usa el componente.
import { Check, X } from 'lucide-react';
import './ProComparison.scss';

// Cada fila es una función que existe en el producto. Pro las incluye todas, así
// que solo hace falta marcar cuáles tiene también Free. No se listan promesas sin
// implementar: la tabla es lo que el usuario compra.
type ProComparisonProps = {
  proPrice: string;
};

type ComparisonRow = {
  feature: string;
  free: boolean;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: 'Reseñas y calificaciones', free: true },
  { feature: 'Likes y comentarios en reseñas', free: true },
  { feature: 'Ver, compartir y dar "me gusta" a listas', free: true },
  { feature: 'Sin anuncios en Musicboxd', free: false },
  { feature: 'Crear y curar tus propias listas', free: false },
  { feature: 'Estadísticas avanzadas de escucha', free: false },
  { feature: 'Badge Pro en perfil y reseñas', free: false },
  { feature: 'Banner personalizado en el perfil', free: false },
  { feature: 'Color de acento para tu perfil', free: false },
  { feature: 'Aportar artistas, álbumes y canciones', free: false },
];

/** @param proPrice precio del plan Pro ya formateado; '—' mientras no cargó. */
export const ProComparison = ({ proPrice }: ProComparisonProps) => {
  return (
    <section className="pro-comparison">
      <h2 className="pro-comparison__heading">Funciones y precios</h2>
      {/* El wrapper habilita scroll horizontal: en mobile la tabla no entra. */}
      <div className="pro-comparison__table-wrap">
        <table className="pro-comparison__table">
          <thead>
            <tr>
              <th className="pro-comparison__th pro-comparison__th--feature"></th>
              <th className="pro-comparison__th">Free</th>
              <th className="pro-comparison__th pro-comparison__th--pro">PRO</th>
            </tr>
            <tr className="pro-comparison__price-row">
              <td className="pro-comparison__td pro-comparison__td--feature">Precio</td>
              <td className="pro-comparison__td">Gratis</td>
              <td className="pro-comparison__td pro-comparison__td--pro-cell">
                {proPrice}, pago único
              </td>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(({ feature, free }) => (
              <tr key={feature} className="pro-comparison__row">
                <td className="pro-comparison__td pro-comparison__td--feature">{feature}</td>
                <td className="pro-comparison__td">
                  {free ? (
                    <Check size={20} className="pro-comparison__check" />
                  ) : (
                    <X size={20} className="pro-comparison__x" />
                  )}
                </td>
                <td className="pro-comparison__td pro-comparison__td--pro-cell">
                  <Check size={20} className="pro-comparison__check" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
