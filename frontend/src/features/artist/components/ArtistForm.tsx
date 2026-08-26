// Formulario de alta y edición de un artista (nombre y biografía).
// Es controlado y no guarda nada: delega el submit al padre, igual que
// CreateUserForm en la feature user.
//
// Lo único que hace por su cuenta es preguntarle a la API si ya hay algún artista
// con un nombre parecido antes de enviar. Si lo hay, muestra un diálogo con esos
// nombres y espera la confirmación: así no entra dos veces el mismo artista
// escrito distinto ("2Pacs" contra "2Pac"). Está acá y no en cada pantalla porque
// el mismo formulario se usa para proponer desde el perfil y para cargar desde el
// panel de administración.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../core/components/Button';
import { FormField, TextInput } from '../../../core/components/FormField';
import { ConfirmDialog } from '../../../core/components/Modal';
import { artistService } from '../services/artistService';
import type { ArtistInput } from '../services/artistService';
import { STATE_LABELS } from '../models/Artist';
import type { SimilarArtist } from '../models/Artist';
import '../styles/_artist.scss';

type ArtistFormProps = {
  /**
   * Valores con los que arranca el formulario. En un alta va vacío; en una edición
   * son los del artista que se está modificando.
   *
   * Se leen una sola vez, al montar: el padre remonta el formulario con una `key`
   * distinta cuando cambia de artista (ver ArtistAdminSection), así no hace falta
   * sincronizar el estado con las props.
   */
  initialValues?: ArtistInput;
  /** En una edición, el artista editado: no tiene que avisar que se parece a sí mismo. */
  excludeArtistId?: number;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Devuelve true si la operación salió bien; con eso el alta limpia los campos. */
  onSubmit: (input: ArtistInput) => Promise<boolean>;
  /** Si se pasa, se muestra un botón para salir sin guardar (se usa al editar). */
  onCancel?: () => void;
};

const EMPTY_FORM: ArtistInput = { name: '', biography: '' };

/**
 * Arma el texto del aviso de nombres parecidos.
 * @param name lo que se escribió.
 * @param similar artistas parecidos que devolvió la API.
 */
function buildSimilarMessage(name: string, similar: SimilarArtist[]): string {
  const list = similar
    .map((artist) => `"${artist.name}" (${STATE_LABELS[artist.state].toLowerCase()})`)
    .join(', ');

  const intro =
    similar.length === 1
      ? `Ya hay un artista con un nombre parecido: ${list}.`
      : `Ya hay artistas con nombres parecidos: ${list}.`;

  return `${intro} ¿Seguro que "${name}" es otro artista?`;
}

export const ArtistForm = ({
  initialValues,
  excludeArtistId,
  isSubmitting,
  submitLabel = 'Guardar artista',
  onSubmit,
  onCancel,
}: ArtistFormProps) => {
  const isEditing = initialValues !== undefined;

  const [form, setForm] = useState<ArtistInput>({
    name: initialValues?.name ?? '',
    biography: initialValues?.biography ?? '',
  });

  // Parecidos encontrados en el último intento: mientras haya alguno, el diálogo
  // está abierto esperando que el usuario decida.
  const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const isBusy = isSubmitting || isChecking;

  /** Manda el formulario al padre. Solo el alta se limpia, y solo si salió bien. */
  const send = async () => {
    const succeeded = await onSubmit(form);
    // En una edición los campos quedan como están porque siguen siendo los datos
    // del artista; en un alta se vacían para poder cargar el siguiente.
    if (succeeded && !isEditing) setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsChecking(true);

    let similar: SimilarArtist[] = [];

    try {
      similar = await artistService.findSimilar(form.name, excludeArtistId);
    } catch {
      // Si la consulta de parecidos falla se sigue de largo: es solo un aviso, y
      // el nombre repetido lo sigue rechazando el backend al guardar.
    } finally {
      setIsChecking(false);
    }

    if (similar.length > 0) {
      setSimilarArtists(similar);
      return;
    }

    await send();
  };

  const handleConfirmSimilar = async () => {
    setSimilarArtists([]);
    await send();
  };

  return (
    <>
      <form className="artist-form" onSubmit={handleSubmit}>
        <FormField id="artist-name" label="Nombre">
          <TextInput
            id="artist-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            // Los límites se validan igual en el backend; acá son para avisar antes
            // de gastar una request.
            maxLength={150}
            required
          />
        </FormField>

        <FormField id="artist-biography" label="Biografía" hint="(opcional)">
          <TextInput
            as="textarea"
            id="artist-biography"
            value={form.biography}
            onChange={(e) => setForm({ ...form, biography: e.target.value })}
            maxLength={5000}
            rows={4}
          />
        </FormField>

        <div className="artist-form__actions">
          <Button type="submit" disabled={isBusy}>
            {isChecking ? 'Revisando...' : isSubmitting ? 'Guardando...' : submitLabel}
          </Button>

          {onCancel && (
            <Button variant="subtle" disabled={isBusy} onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        isOpen={similarArtists.length > 0}
        title="Puede que ya esté cargado"
        message={buildSimilarMessage(form.name, similarArtists)}
        confirmLabel="Sí, es otro artista"
        cancelLabel="Revisar el nombre"
        onConfirm={handleConfirmSimilar}
        onCancel={() => setSimilarArtists([])}
      />
    </>
  );
};
