// Sección "Métricas" del panel de administración: pide las métricas de ventas y
// usuarios, maneja la carga y los errores, y deja elegir el año.
//
// El dibujo lo hace RevenueDashboard. Vive en la feature membership, igual que
// PlanAdminSection, para que AdminPage solo tenga que montarla.
//
// Los datos son siempre los reales: salen de las tablas de pagos, suscripciones y
// usuarios. Una venta que entra por MercadoPago aparece al volver a abrir la
// pestaña o al cambiar de año.
import { useState } from 'react';
import { Alert } from '../../../core/components/Alert';
import { Card } from '../../../core/components/Card';
import { Loader } from '../../../core/components/Loader';
import { SegmentedControl } from '../../../core/components/SegmentedControl';
import { useFetch } from '../../../core/hooks/useFetch';
import { membershipService } from '../services/membershipService';
import { RevenueDashboard } from './RevenueDashboard';

export const RevenueAdminSection = () => {
  // undefined hasta que el admin elige uno: la API usa el año en curso.
  const [year, setYear] = useState<number | undefined>(undefined);

  // El año va como clave de useFetch: al cambiarlo, se vuelve a pedir solo.
  const { data: stats, isLoading, error } = useFetch(
    () => membershipService.getRevenueStats(year),
    year ?? ''
  );

  const handleYearChange = (value: string) => {
    setYear(Number(value));
  };

  return (
    <Card
      title="Métricas de la membresía"
      subtitle="Ventas de la membresía Pro y cómo se reparten los usuarios entre los planes."
    >
      {isLoading ? (
        <Loader message="Calculando las métricas..." />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : (
        stats && (
          <>
            {/* Solo si hay de dónde elegir: con un único año el selector sobra. */}
            {stats.availableYears.length > 1 && (
              <div className="revenue-toolbar">
                <SegmentedControl
                  options={stats.availableYears.map((option) => ({
                    value: String(option),
                    label: String(option),
                  }))}
                  value={String(stats.year)}
                  onChange={handleYearChange}
                  ariaLabel="Año de las métricas"
                />
              </div>
            )}

            {/* La key hace que los números vuelvan a contar desde cero al cambiar de año. */}
            <RevenueDashboard key={stats.year} stats={stats} />
          </>
        )
      )}
    </Card>
  );
};
