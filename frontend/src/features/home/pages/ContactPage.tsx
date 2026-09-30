// Página /contact: el formulario para escribirle al equipo.
//
// El mensaje se envía de verdad: lo recibe Web3Forms y lo reenvía por mail (ver
// services/contactService). Por eso el cartel de éxito aparece recién cuando
// Web3Forms confirma el envío, y si falla se muestra el error.
//
// Valida con reglas propias (core/utils/validators), no con las del navegador.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';
import { getErrorMessage } from '../../../core/utils/errorHandler';
import {
  fieldErrorProps,
  hasErrors,
  isEmail,
  maxLength,
  minLength,
  required,
  validateField,
} from '../../../core/utils/validators';
import type { FieldErrors } from '../../../core/utils/validators';
import { contactService } from '../services/contactService';

type ContactField = 'name' | 'email' | 'message';

type ContactValues = Record<ContactField, string>;

const EMPTY_VALUES: ContactValues = { name: '', email: '', message: '' };

/**
 * Valida el mensaje. No hay un backend propio del que copiar las reglas: los
 * topes son para que el mail que llega sea legible, y el mínimo del mensaje evita
 * envíos vacíos de contenido ("hola").
 */
function validateContactForm(values: ContactValues): FieldErrors<ContactField> {
  return {
    name: validateField(values.name, [
      required('Ingresá tu nombre.'),
      maxLength(100, 'El nombre no puede tener más de 100 caracteres.'),
    ]),
    email: validateField(values.email, [required('Ingresá tu email.'), isEmail()]),
    message: validateField(values.message, [
      required('Escribí tu mensaje.'),
      minLength(10, 'El mensaje tiene que tener al menos 10 caracteres.'),
      maxLength(5000, 'El mensaje no puede tener más de 5000 caracteres.'),
    ]),
  };
}

export const ContactPage = () => {
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  // La trampa para bots: una persona nunca la ve, así que nunca la marca.
  const [botcheck, setBotcheck] = useState(false);
  // Errores visibles recién después del primer intento de enviar; desde ahí se
  // recalculan en cada tecla (criterio común a todos los formularios).
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [wasSent, setWasSent] = useState(false);

  const errors: FieldErrors<ContactField> = wasSubmitted ? validateContactForm(values) : {};

  /** Actualiza un solo campo, dejando los demás como estaban. */
  const handleChange = (field: ContactField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (hasErrors(validateContactForm(values))) return;

    setIsSending(true);
    setSendError(null);

    try {
      await contactService.send({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        botcheck,
      });
      setWasSent(true);
      setValues(EMPTY_VALUES);
      setWasSubmitted(false);
    } catch (error) {
      // Lo que escribió el usuario queda en el formulario para reintentar.
      setSendError(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="static-page">
        <FadeInSection>
          <div className="static-page__container">
            <h1 className="static-page__title">Contacto</h1>
            <div className="static-page__content">
              <p>¿Tienes alguna duda, sugerencia o encontraste un problema técnico? Envíanos un mensaje y nos pondremos en contacto contigo lo antes posible.</p>

              {wasSent ? (
                <>
                  <Alert tone="success">
                    ¡Mensaje enviado! Te vamos a responder al email que nos dejaste.
                  </Alert>
                  <button
                    type="button"
                    className="static-page__link-btn"
                    onClick={() => setWasSent(false)}
                  >
                    Enviar otro mensaje
                  </button>
                </>
              ) : (
                <form className="static-page__contact-form" onSubmit={handleSubmit} noValidate>
                  {sendError && <Alert tone="error">{sendError}</Alert>}

                  <div className="form-group">
                    <label htmlFor="contact-name">Nombre</label>
                    <input
                      type="text"
                      id="contact-name"
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Tu nombre completo"
                      {...fieldErrorProps('contact-name', errors.name)}
                    />
                    {errors.name && (
                      <p className="form-group__error" id="contact-name-error">{errors.name}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-email">Correo electrónico</label>
                    {/* type="text" + inputMode: type="email" trae la validación del navegador. */}
                    <input
                      type="text"
                      inputMode="email"
                      id="contact-email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="tu@correo.com"
                      {...fieldErrorProps('contact-email', errors.email)}
                    />
                    {errors.email && (
                      <p className="form-group__error" id="contact-email-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">Mensaje</label>
                    <textarea
                      id="contact-message"
                      value={values.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="¿En qué podemos ayudarte?"
                      {...fieldErrorProps('contact-message', errors.message)}
                    ></textarea>
                    {errors.message && (
                      <p className="form-group__error" id="contact-message-error">{errors.message}</p>
                    )}
                  </div>

                  {/* Trampa para bots: fuera de la pantalla, del orden de tabulación
                      y del lector de pantalla. Ver contactService. */}
                  <div className="form-group form-group--honeypot" aria-hidden="true">
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      autoComplete="off"
                      checked={botcheck}
                      onChange={(e) => setBotcheck(e.target.checked)}
                    />
                  </div>

                  <button type="submit" disabled={isSending}>
                    {isSending ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </FadeInSection>
      </main>
      <FadeInSection delay={200}>
        <Footer />
      </FadeInSection>
    </>
  );
};
