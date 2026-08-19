// Tabla comparativa Free vs Pro de la página Pro.
// Es presentacional y sin estado: solo dibuja la grilla de funciones.
import { Check, X } from 'lucide-react';

// Cada fila es una función del producto. `pro` marca si Pro la incluye; cuando
// en vez de un tilde hay que mostrar un texto (por ejemplo "Ilimitadas"), se usa
// `proText`, que tiene prioridad sobre `pro`.
type ComparisonRow = {
  feature: string;
  free: boolean;
  pro?: boolean;
  proText?: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: 'Sin anuncios en Musicboxd', free: false, pro: true },
  { feature: 'Reseñas y calificaciones', free: true, pro: true },
  { feature: 'Badge Pro en perfil y reseñas', free: false, pro: true },
  { feature: 'Banner personalizado en el perfil', free: false, pro: true },
  { feature: 'Estadísticas avanzadas de escucha', free: false, pro: true },
  { feature: 'Temas de colores para tu perfil', free: false, pro: true },
  { feature: 'Listas (máx. 10)', free: true, proText: 'Ilimitadas' },
  { feature: 'Largo ilimitado en reseñas', free: false, pro: true },
  { feature: 'Aportar artistas, álbumes y canciones', free: false, pro: true },
  { feature: 'Acceso anticipado a funciones', free: false, pro: true },
  { feature: 'Soporte prioritario', free: false, pro: true },
];

export const ProComparison = () => {
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
              <td className="pro-comparison__td pro-comparison__td--pro-cell">$4.99 / mes</td>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(({ feature, free, proText }) => (
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
                  {proText ? (
                    <span className="pro-comparison__label">{proText}</span>
                  ) : (
                    <Check size={20} className="pro-comparison__check" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
