// Sección "Anuncios" del panel de administración: el ABM completo de la
// publicidad que se le muestra a los usuarios Free.
//
// Concentra el estado y las llamadas a la API, y delega el dibujo en AdForm y
// AdAdminTable. Sigue la misma forma que PlanAdminSection: un anuncio no lo
// aporta ningún usuario, lo carga el sitio, así que no tiene circuito de
// moderación ni buscador. Toda la escritura la restringe el backend a ADMIN.
//
// La diferencia con los planes está en la baja: un plan se bloquea por las
// suscripciones que lo apuntan, pero a un anuncio no lo apunta nada, así que
// siempre se puede borrar. Igual lo normal es pausarlo (el botón del ojo) en vez
// de eliminarlo, porque así no se pierde lo cargado.
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '../../../../core/components/Alert';
import { Button } from '../../../../core/components/Button';
import { Card } from '../../../../core/components/Card';
import { FormModal } from '../../../../core/components/FormModal';
import { Loader } from '../../../../core/components/Loader';
import { ConfirmDialog } from '../../../../core/components/Modal';
import { useFetch } from '../../../../core/hooks/useFetch';
import { getErrorMessage } from '../../../../core/utils/errorHandler';
import { adService } from '../../services/adService';
import type { AdInput } from '../../services/adService';
import type { Ad } from '../../models/Ad';
import { AdForm } from '../AdForm';
import type { AdFormValues } from '../AdForm';
import { AdAdminTable } from '../AdAdminTable';
import './AdAdminSection.scss';

/**
 * Pasa un anuncio a los valores que espera el formulario de edición.
 * Los campos que en la base son NULL vuelven a ser texto vacío, que es lo que
 * un input sabe mostrar.
 *
 * @param ad anuncio que se está editando.
 */
function toFormValues(ad: Ad): AdFormValues {
  return {
    title: ad.title,
    description: ad.description ?? '',
    urlImage: ad.imageUrl,
    targetUrl: ad.targetUrl ?? '',
  };
}

export const AdAdminSection = () => {
  const {
    data,
    isLoading,
    error,
    reload: loadAds,
    setError,
  } = useFetch(() => adService.list());
  const ads = data ?? [];

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Anuncio que se está editando: si es null, el formulario es de alta.
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  // Fila con una operación en curso: deshabilita solo sus botones, no toda la tabla.
  const [busyAdId, setBusyAdId] = useState<number | null>(null);
  // Anuncio elegido para eliminar, a la espera de que confirmen el diálogo.
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);

  // El formulario vive en un modal: al panel se entra a mirar mucho más seguido
  // que a cargar, así que el alta espera detrás de un botón.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Error del alta o de la edición. Va aparte del error de la sección porque se
  // muestra DENTRO del modal: si se mostrara afuera, quedaría tapado.
  const [formError, setFormError] = useState<string | null>(null);

  const activeCount = ads.filter((ad) => ad.isActive).length;

  /**
   * Abre el modal del formulario.
   * @param ad anuncio a editar, o null para cargar uno nuevo.
   */
  const handleOpenForm = (ad: Ad | null) => {
    setEditingAd(ad);
    setFormError(null);
    setFeedback(null);
    setIsFormOpen(true);
  };

  /** Guarda el formulario: edita si hay un anuncio elegido, si no da de alta uno nuevo. */
  const handleSubmit = async (input: AdInput): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setFormError(null);
    setFeedback(null);

    try {
      if (editingAd) {
        await adService.update(editingAd.id, input);
        setFeedback(`Se guardaron los cambios de "${input.title}".`);
      } else {
        const created = await adService.create(input);
        setFeedback(`Se agregó el anuncio "${created.title}".`);
      }
      await loadAds();
      setIsFormOpen(false);
      return true;
    } catch (err) {
      // El modal queda abierto con lo que se había escrito: cerrarlo obligaría a
      // tipear todo de nuevo por un título repetido.
      setFormError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Saca un anuncio de circulación, o lo vuelve a poner. */
  const handleToggleActive = async (ad: Ad) => {
    setBusyAdId(ad.id);
    setError(null);
    setFeedback(null);

    try {
      // Se manda SOLO el campo `active`: el resto del anuncio queda como estaba.
      await adService.update(ad.id, { active: !ad.isActive });
      await loadAds();
      setFeedback(
        ad.isActive
          ? `"${ad.title}" dejó de mostrarse. Se puede reanudar cuando quieras.`
          : `"${ad.title}" volvió a circulación.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAdId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;

    const { id, title } = adToDelete;
    setAdToDelete(null);
    setBusyAdId(id);
    setError(null);
    setFeedback(null);

    try {
      await adService.remove(id);
      // Si se estaba editando justo ese anuncio, el formulario ya no aplica.
      setEditingAd((current) => (current?.id === id ? null : current));
      await loadAds();
      setFeedback(`Se eliminó el anuncio "${title}".`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAdId(null);
    }
  };

  return (
    // La Card exterior es la que le da el marco al panel, igual que en las otras
    // secciones del administrador.
    <Card
      title="Anuncios"
      subtitle="La publicidad que ven los usuarios Free. Un Pro o un Admin no ve ninguna."
    >
      <div className="ad-admin">
        {error && <Alert tone="error">{error}</Alert>}
        {feedback && <Alert tone="success">{feedback}</Alert>}

        <div className="ad-admin__toolbar">
          <h3 className="ad-admin__list-title">
            Anuncios cargados ({ads.length}) · en circulación: {activeCount}
          </h3>

          <Button onClick={() => handleOpenForm(null)}>
            <Plus size={16} aria-hidden="true" />
            Agregar anuncio
          </Button>
        </div>

        {isLoading ? (
          <Loader message="Cargando anuncios..." />
        ) : ads.length === 0 ? (
          <p className="ad-admin__empty">
            Todavía no hay anuncios cargados. Mientras no haya ninguno en circulación, los
            usuarios Free navegan sin publicidad.
          </p>
        ) : (
          <AdAdminTable
            ads={ads}
            busyAdId={busyAdId}
            onEdit={handleOpenForm}
            onToggleActive={handleToggleActive}
            onDelete={setAdToDelete}
          />
        )}

        {/* El mismo modal sirve para el alta y para la edición: lo que cambia son
            el título, los valores iniciales y a qué handler se manda. La key lo
            remonta al pasar de uno a otro. */}
        <FormModal
          isOpen={isFormOpen}
          title={editingAd ? `Editando "${editingAd.title}"` : 'Agregar anuncio'}
          hint="La imagen va en frontend/public/images/ads/ y acá se escribe su ruta. Conviene que sea vertical (3:4)."
          error={formError}
          isBusy={isSubmitting}
          onClose={() => setIsFormOpen(false)}
        >
          <AdForm
            key={editingAd?.id ?? 'new'}
            initialValues={editingAd ? toFormValues(editingAd) : undefined}
            isSubmitting={isSubmitting}
            submitLabel={editingAd ? 'Guardar cambios' : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </FormModal>

        <ConfirmDialog
          isOpen={adToDelete !== null}
          title="Eliminar anuncio"
          message={
            adToDelete
              ? `¿Seguro que querés eliminar "${adToDelete.title}"? La acción no se puede deshacer. Si solo querés dejar de mostrarlo, pausalo en vez de borrarlo.`
              : ''
          }
          confirmLabel="Eliminar"
          isDestructive
          onConfirm={handleConfirmDelete}
          onCancel={() => setAdToDelete(null)}
        />
      </div>
    </Card>
  );
};
