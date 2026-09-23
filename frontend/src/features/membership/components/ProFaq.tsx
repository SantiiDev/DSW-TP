// Acordeón de preguntas frecuentes de la página Pro.
// Es autónomo: guarda con useState cuál pregunta está abierta y no recibe props.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: '¿Se renueva sola? ¿Me la van a cobrar de nuevo?',
    answer:
      'No. La membresía Pro es un pago único: se paga una sola vez y el acceso no vence. No hay renovación, no hay cobros más adelante y no guardamos los datos de tu tarjeta.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal y MercadoPago.',
  },
  {
    question: '¿Puedo perder el acceso Pro?',
    answer:
      'No por el paso del tiempo: lo que pagaste no vence. Un administrador solo puede quitarlo si la cuenta incumple las reglas de la comunidad, y en ese caso tus reseñas, calificaciones y listas se mantienen igual.',
  },
  {
    question: '¿Qué pasa con los artistas y álbumes que aporté?',
    answer:
      'Los aportes aprobados quedan en el catálogo de Musicboxd para toda la comunidad, pase lo que pase con tu cuenta.',
  },
  {
    question: '¿Hay descuento para estudiantes?',
    answer:
      'Sí, ofrecemos un 50% de descuento para estudiantes verificados. Contactanos a soporte@musicboxd.com con tu certificado estudiantil.',
  },
];

export const ProFaq = () => {
  // -1 significa "ninguna abierta": es un acordeón de una pregunta por vez.
  const [openFaq, setOpenFaq] = useState(-1);

  // Abre la pregunta clickeada, o la cierra si ya era la que estaba abierta.
  const handleToggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  return (
    <section className="pro-faq">
      <h2 className="pro-faq__heading">Preguntas frecuentes</h2>
      <div className="pro-faq__list">
        {FAQ_ITEMS.map(({ question, answer }, index) => (
          <div
            key={question}
            className={`pro-faq__item ${openFaq === index ? 'pro-faq__item--open' : ''}`}
          >
            <button
              type="button"
              className="pro-faq__question"
              onClick={() => handleToggleFaq(index)}
              aria-expanded={openFaq === index}
            >
              <span>{question}</span>
              <ChevronDown size={20} className="pro-faq__chevron" />
            </button>
            <div className="pro-faq__answer">
              <p>{answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
