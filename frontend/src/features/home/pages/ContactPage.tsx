import { useState } from 'react';
import { Navbar } from '../../../core/components/Navbar';
import { Footer } from '../../../core/components/Footer';
import { FadeInSection } from '../../../core/components/FadeInSection';

export const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulamos el envío del mensaje
    setSent(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 4000);
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
              
              {sent ? (
                <div style={{ padding: '16px', backgroundColor: 'rgba(30, 215, 96, 0.1)', color: '#1ED760', borderRadius: '8px', border: '1px solid #1ED760', marginTop: '24px' }}>
                  ¡Mensaje enviado con éxito! Te responderemos en breve.
                </div>
              ) : (
                <form className="static-page__contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Nombre</label>
                    <input 
                      type="text" 
                      id="name" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input 
                      type="email" 
                      id="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@correo.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Mensaje</label>
                    <textarea 
                      id="message" 
                      required 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="¿En qué podemos ayudarte?"
                    ></textarea>
                  </div>
                  <button type="submit">Enviar mensaje</button>
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
