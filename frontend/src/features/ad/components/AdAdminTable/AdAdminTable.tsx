// Tabla de anuncios del panel de administración: muestra cada anuncio con su
// miniatura, su título, a dónde lleva y si está en circulación, más los botones
// de pausar/reanudar, editar y eliminar.
//
// Solo define sus columnas: el armado de la tabla (wrapper con scroll, cabecera,
// filas) lo pone DataTable, el mismo que usan las tablas de planes y usuarios.
//
// Es presentacional: no llama a la API ni guarda estado propio; avisa al padre
// (AdAdminSection) con los handlers que recibe.
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../../core/components/Badge';
import { DataTable } from '../../../../core/components/DataTable';
import type { DataTableColumn } from '../../../../core/components/DataTable';
import { IconButton } from '../../../../core/components/IconButton';
import type { Ad } from '../../models/Ad';
import '../AdAdminSection/AdAdminSection.scss';

type AdAdminTableProps = {
  ads: Ad[];
  /** Id de la fila con una operación en curso, para deshabilitar sus botones. */
  busyAdId: number | null;
  onEdit: (ad: Ad) => void;
  onToggleActive: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
};

export const AdAdminTable = ({
  ads,
  busyAdId,
  onEdit,
  onToggleActive,
  onDelete,
}: AdAdminTableProps) => {
  const columns: DataTableColumn<Ad>[] = [
    {
      key: 'image',
      header: 'Imagen',
      render: (ad) => (
        // La miniatura es la forma más rápida de darse cuenta de que una ruta
        // quedó mal escrita: si el archivo no está, acá se ve el hueco.
        <img className="ad-admin__thumb" src={ad.imageUrl} alt="" />
      ),
    },
    {
      key: 'title',
      header: 'Anuncio',
      render: (ad) => (
        <div className="ad-admin__title-cell">
          <span className="data-table__name-cell">{ad.title}</span>
          {ad.hasDescription && (
            <span className="ad-admin__description">{ad.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Enlace',
      render: (ad) => {
        if (!ad.hasLink) return <span className="ad-admin__no-link">Sin enlace</span>;

        // Una ruta del propio sitio navega con React Router; una dirección de
        // afuera abre una pestaña nueva, para no perder el panel a medio usar.
        if (ad.isInternalLink) {
          return (
            <Link className="ad-admin__link" to={ad.targetUrl as string}>
              {ad.linkLabel}
            </Link>
          );
        }

        return (
          <a
            className="ad-admin__link"
            href={ad.targetUrl as string}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ad.linkLabel}
          </a>
        );
      },
    },
    {
      key: 'active',
      header: 'Estado',
      render: (ad) => (
        <Badge tone={ad.isActive ? 'success' : 'neutral'}>
          {ad.isActive ? 'En circulación' : 'Pausado'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (ad) => {
        const isBusy = busyAdId === ad.id;

        return (
          <div className="data-table__actions">
            {/* Pausar en vez de borrar: saca el anuncio de circulación sin perder
                lo que se cargó, que es lo que se quiere la mayoría de las veces. */}
            <IconButton
              icon={
                ad.isActive ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )
              }
              label={ad.isActive ? 'Pausar' : 'Reanudar'}
              disabled={isBusy}
              onClick={() => onToggleActive(ad)}
            />

            <IconButton
              icon={<Pencil size={16} aria-hidden="true" />}
              label="Editar"
              disabled={isBusy}
              onClick={() => onEdit(ad)}
            />

            <IconButton
              icon={<Trash2 size={16} aria-hidden="true" />}
              label="Eliminar"
              tone="danger"
              disabled={isBusy}
              onClick={() => onDelete(ad)}
            />
          </div>
        );
      },
    },
  ];

  // align="top": la celda del anuncio puede ocupar dos líneas y el resto tienen
  // que arrancar arriba, no centrarse contra ella.
  return <DataTable columns={columns} rows={ads} getRowKey={(ad) => ad.id} align="top" />;
};
