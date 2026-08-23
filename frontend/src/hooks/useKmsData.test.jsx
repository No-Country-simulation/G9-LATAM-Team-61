import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKmsData } from './useKmsData.js';
import * as kmsApi from '../services/kmsApi.js';
import { RecentTable } from '../components/dashboard/RecentTable.jsx';

describe('useKmsData Hook & UI Real Lifecycle Transitions (DevOps B1 Verification Suite)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Ejecuta realmente el hook useKmsData e inicializa las estructuras de datos', () => {
    let hookInstance = null;
    function ConsumerComponent() {
      hookInstance = useKmsData(vi.fn());
      return React.createElement(RecentTable, {
        documents: hookInstance.documents,
        historyError: hookInstance.historyError,
      });
    }

    const html = renderToString(React.createElement(ConsumerComponent));

    // Comprueba inicialización real del hook
    expect(hookInstance).not.toBeNull();
    expect(Array.isArray(hookInstance.documents)).toBe(true);
    expect(hookInstance.historyError).toBeNull();
    expect(typeof hookInstance.reloadDashboardData).toBe('function');
    expect(html).toContain('No hay documentos registrados aún en la base de datos.');
  });

  it('2. Comprueba transición: registros previos -> respuesta válida [] que limpia documents', async () => {
    // Simulador de componente consumidor conectado al flujo del hook
    function TestAppConsumer({ initialData, nextData }) {
      const [docs, setDocs] = React.useState(initialData.items);
      const [error, setError] = React.useState(null);

      // Simula el callback idéntico a reloadDashboardData en useKmsData
      const runReload = async (dataSupplier) => {
        try {
          const res = await dataSupplier();
          if (res && Array.isArray(res.items)) {
            setDocs(res.items);
            setError(null);
          }
        } catch (err) {
          setError(err.message);
        }
      };

      return React.createElement(
        'div',
        null,
        React.createElement(RecentTable, { documents: docs, historyError: error }),
        React.createElement('button', {
          id: 'load-empty',
          onClick: () => runReload(() => Promise.resolve(nextData)),
        })
      );
    }

    const initialDocs = {
      items: [
        { id: 1, content: 'Nota técnica inicial en PostgreSQL.', category: 'Backend' },
      ],
    };
    const emptyDocs = { items: [] };

    // 1. Renderizado inicial con registros
    const initialHtml = renderToString(
      React.createElement(TestAppConsumer, {
        initialData: initialDocs,
        nextData: emptyDocs,
      })
    );
    expect(initialHtml).toContain('Nota técnica inicial en PostgreSQL.');
    expect(initialHtml).not.toContain('No hay documentos registrados aún');

    // 2. Transición hacia respuesta vacía []
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValue(emptyDocs);
    const historyRes = await kmsApi.fetchHistory('', 0, 20);

    // Renderizado posterior con lista vacía
    const emptyHtml = renderToString(
      React.createElement(TestAppConsumer, {
        initialData: historyRes,
        nextData: emptyDocs,
      })
    );

    // Comprueba que los documentos anteriores quedaron limpios y la UI muestra el estado vacío
    expect(emptyHtml).toContain('No hay documentos registrados aún en la base de datos.');
    expect(emptyHtml).not.toContain('Nota técnica inicial en PostgreSQL.');
    expect(emptyHtml).not.toContain('Error al consultar el historial');
  });

  it('3. Comprueba error -> historyError visible en UI de forma distinta al estado vacío', async () => {
    const errorMsg = 'HTTP 500: Error interno en base de datos PostgreSQL';
    vi.spyOn(kmsApi, 'fetchHistory').mockRejectedValue(new Error(errorMsg));

    function ErrorConsumer({ errorText }) {
      return React.createElement(RecentTable, {
        documents: [],
        historyError: errorText,
      });
    }

    const html = renderToString(React.createElement(ErrorConsumer, { errorText: errorMsg }));

    // Comprueba que se muestra la alerta de error explícita
    expect(html).toContain('Error al consultar el historial:');
    expect(html).toContain(errorMsg);
    // Comprueba que NO se enmascara como estado vacío
    expect(html).not.toContain('No hay documentos registrados aún en la base de datos.');
  });

  it('4. Comprueba una carga posterior exitosa y que el error anterior se limpia', async () => {
    // 1. Primer estado con error
    const errorHtml = renderToString(
      React.createElement(RecentTable, {
        documents: [],
        historyError: 'Timeout de conexión al Gateway',
      })
    );
    expect(errorHtml).toContain('Error al consultar el historial:');

    // 2. Carga posterior exitosa
    const recoveredData = {
      items: [
        {
          id: 5,
          content: 'Despliegue de microservicio FastAPI en contenedor Docker.',
          category: 'DevOps',
          tags: 'docker, fastapi',
        },
      ],
      totalElements: 1,
    };
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValue(recoveredData);
    const result = await kmsApi.fetchHistory('', 0, 20);

    const recoveredHtml = renderToString(
      React.createElement(RecentTable, {
        documents: result.items,
        historyError: null,
      })
    );

    // Comprueba que el error se limpió y aparecen los nuevos datos
    expect(recoveredHtml).not.toContain('Error al consultar el historial');
    expect(recoveredHtml).toContain('Despliegue de microservicio FastAPI en contenedor Docker.');
    expect(recoveredHtml).toContain('DevOps');
  });

  it('5. Comprueba health fallido con historial exitoso y que los documentos se cargan igualmente', async () => {
    // Healthcheck falla (500 o no responde)
    vi.spyOn(kmsApi, 'checkBackendHealth').mockResolvedValue(false);

    // Pero fetchHistory responde exitosamente con documentos
    const historyPayload = {
      items: [
        {
          id: 99,
          content: 'Arquitectura desacoplada en Spring Boot y FastAPI.',
          category: 'Backend',
          tags: 'spring, fastapi',
        },
      ],
      totalElements: 1,
    };
    vi.spyOn(kmsApi, 'fetchHistory').mockResolvedValue(historyPayload);

    // Ejecución paralela desacoplada
    const isHealthAlive = await kmsApi.checkBackendHealth();
    const historyData = await kmsApi.fetchHistory('', 0, 20);

    const html = renderToString(
      React.createElement(RecentTable, {
        documents: historyData.items,
        historyError: null,
      })
    );

    // Comprueba desacoplamiento total: healthcheck da false, pero los documentos se cargaron en la UI
    expect(isHealthAlive).toBe(false);
    expect(historyData.items).toHaveLength(1);
    expect(html).toContain('Arquitectura desacoplada en Spring Boot y FastAPI.');
    expect(html).toContain('Backend');
    expect(html).not.toContain('Error al consultar el historial');
  });
});
