import { useState } from 'react';
import { Navbar } from '../../../../core/components/Navbar';
import { Footer } from '../../../../core/components/Footer';
import { FadeInSection } from '../../../../core/components/FadeInSection';
import { ChevronDown } from 'lucide-react';
import '../../styles/static-pages.scss';

const FAQS = [
  {
    question: "¿Qué es Musicboxd?",
    answer: "Musicboxd es una red social y catálogo para amantes de la música. Te permite llevar un registro de lo que escuchas, calificar álbumes, escribir reseñas y compartir tus listas favoritas con la comunidad."
  },
  {
    question: "¿Cómo califico un álbum?",
    answer: "Al ingresar a la página de cualquier álbum, verás una sección de estrellas. Solo tienes que hacer click en la cantidad de estrellas que creas que merece (de media a cinco, de a media estrella). También podrás agregar una reseña opcional."
  },
  {
    question: "¿Cuál es la diferencia entre Free y Pro?",
    answer: "La cuenta Free te da acceso a todas las funciones básicas: reseñar, calificar, comentar y dar \"me gusta\" a reseñas y listas. La cuenta Pro, con un pago único, suma estadísticas avanzadas, personalización del perfil (banner y color de acento), la posibilidad de armar tus propias listas y de aportar al catálogo, una insignia Pro y una experiencia libre de anuncios."
  },
  {
    question: "¿Puedo importar mi historial desde otras plataformas?",
    answer: "Por el momento, no contamos con una herramienta automática de importación, pero es una función que nuestro equipo está evaluando para futuras versiones."
  },
  {
    question: "¿Cómo reporto un comportamiento abusivo?",
    answer: "Escribinos desde la página de Contacto contándonos qué reseña o usuario querés reportar. Nuestro equipo de moderación lo revisará y, si corresponde, ocultará el contenido o suspenderá la cuenta."
  }
];

export const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <main className="static-page">
        <FadeInSection>
          <div className="static-page__container">
            <h1 className="static-page__title">Preguntas Frecuentes</h1>
            <div className="static-page__content">
              <p>Encuentra respuestas rápidas a las consultas más comunes de nuestra comunidad. Si no encuentras lo que buscas, no dudes en ir a la sección de Contacto.</p>
              
              <div className="static-page__faq-list">
                {FAQS.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`static-page__faq-item ${openIndex === index ? 'active' : ''}`}
                  >
                    <button 
                      className="static-page__faq-question" 
                      onClick={() => toggleFaq(index)}
                    >
                      {faq.question}
                      <ChevronDown size={20} />
                    </button>
                    <div className="static-page__faq-answer">
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
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
