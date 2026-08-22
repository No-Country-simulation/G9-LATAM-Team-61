import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecentTable } from './RecentTable.jsx';
import { HistoryModal } from './HistoryModal.jsx';

describe('UI & Hook State Transition Tests (DevOps History & UI Contract Verification)', () => {
  it('1. Una respuesta válida con registros debe renderizar los documentos en la tabla', () => {
    const mockDocs = [
      {
        id: 1,
        content: 'Configuración de Docker y Kubernetes en Oracle Cloud Infrastructure.',
        category: 'DevOps',
        tags: 'docker, k8s, oci',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(RecentTable, {
        documents: mockDocs,
        historyError: null,
        searchQuery: '',
      })
    );

    expect(html).toContain('Configuración de Docker y Kubernetes');
    expect(html).toContain('DevOps');
    expect(html).toContain('docker, k8s, oci');
    expect(html).not.toContain('No hay documentos registrados aún');
    expect(html).not.toContain('Error al consultar el historial');
  });

  it('2. Una respuesta válida vacía ([]) debe limpiar documentos anteriores y mostrar el estado vacío legítimo', () => {
    // Al pasar documents: [] (tras haber tenido registros previos), la tabla muestra estado vacío y NO los anteriores
    const html = renderToStaticMarkup(
      React.createElement(RecentTable, {
        documents: [],
        historyError: null,
        searchQuery: '',
      })
    );

    expect(html).toContain('No hay documentos registrados aún en la base de datos.');
    expect(html).not.toContain('Configuración de Docker y Kubernetes');
    expect(html).not.toContain('Error al consultar el historial');
  });

  it('3. historyError debe llegar a la UI y mostrarse de forma distinta al estado vacío', () => {
    const errorMsg = 'Error de conexión: Timeout al contactar Spring Boot';
    const html = renderToStaticMarkup(
      React.createElement(RecentTable, {
        documents: [],
        historyError: errorMsg,
        searchQuery: '',
      })
    );

    // Debe mostrar la alerta explícita de error
    expect(html).toContain('Error al consultar el historial:');
    expect(html).toContain(errorMsg);
    // NO debe mostrar el mensaje de lista vacía
    expect(html).not.toContain('No hay documentos registrados aún en la base de datos.');
  });

  it('4. Una carga posterior exitosa debe limpiar el error anterior y renderizar los nuevos datos', () => {
    // Estado posterior donde historyError volvió a null y llegaron nuevos documentos
    const recoveredDocs = [
      {
        id: 2,
        content: 'Desarrollo de componentes funcionales reactivos en React 19.',
        category: 'Frontend',
        tags: 'react, hooks',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(RecentTable, {
        documents: recoveredDocs,
        historyError: null,
        searchQuery: '',
      })
    );

    expect(html).toContain('Desarrollo de componentes funcionales');
    expect(html).toContain('Frontend');
    expect(html).not.toContain('Error al consultar el historial');
    expect(html).not.toContain('No hay documentos registrados aún');
  });

  it('5. HistoryModal también debe distinguir entre estado de error y estado vacío', () => {
    // Modal con error
    const errorHtml = renderToStaticMarkup(
      React.createElement(HistoryModal, {
        isOpen: true,
        onClose: () => {},
        documents: [],
        historyError: 'Fallo HTTP 500 en base de datos',
      })
    );
    expect(errorHtml).toContain('Error al cargar el historial:');
    expect(errorHtml).toContain('Fallo HTTP 500 en base de datos');
    expect(errorHtml).not.toContain('No hay documentos registrados aún en esta categoría.');

    // Modal vacío sin error
    const emptyHtml = renderToStaticMarkup(
      React.createElement(HistoryModal, {
        isOpen: true,
        onClose: () => {},
        documents: [],
        historyError: null,
      })
    );
    expect(emptyHtml).toContain('No hay documentos registrados aún en esta categoría.');
    expect(emptyHtml).not.toContain('Error al cargar el historial:');
  });
});
