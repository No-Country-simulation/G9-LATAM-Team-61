// Service layer for KMS Inference API & Mock Data

export const INITIAL_DOCUMENTS = [
  { id: 1, title: 'Manejo de errores JWT', category: 'Backend', badgeClass: 'backend', tags: 'spring, auth, token', date: 'Hoy, 14:30' },
  { id: 2, title: 'Guía useEffect React', category: 'Frontend', badgeClass: 'frontend', tags: 'react, hooks', date: 'Hoy, 10:15' },
  { id: 3, title: 'Balanceador en OCI', category: 'DevOps', badgeClass: 'devops', tags: 'oci, network', date: 'Ayer, 18:45' },
  { id: 4, title: 'Estructura de BD PostgreSQL', category: 'Backend', badgeClass: 'backend', tags: 'sql, schema', date: 'Ayer, 11:20' },
  { id: 5, title: 'CI/CD Actions YAML', category: 'DevOps', badgeClass: 'devops', tags: 'github, deploy', date: '17 Jul, 09:10' },
  { id: 6, title: 'Optimización de Vite.js', category: 'Frontend', badgeClass: 'frontend', tags: 'vite, build', date: '16 Jul, 16:05' }
];

export function inferTitleFromContent(text) {
  if (!text) return 'Sin Título';
  const firstLine = text.split('\n')[0].substring(0, 35);
  return firstLine.charAt(0).toUpperCase() + firstLine.slice(1) + (text.length > 35 ? '...' : '');
}

/**
 * Classify a text payload (simulating POST /api/contenido endpoint)
 */
export async function classifyContent({ title, content }) {
  const contentText = (content || '').trim();
  const docTitle = (title || '').trim() || inferTitleFromContent(contentText);

  const lower = contentText.toLowerCase();
  let category = 'Backend';
  let badgeClass = 'backend';
  let tags = 'java, spring, rest';
  let confidence = (89 + Math.random() * 9).toFixed(1) + '%';

  if (lower.includes('react') || lower.includes('css') || lower.includes('html') || lower.includes('frontend') || lower.includes('vite')) {
    category = 'Frontend';
    badgeClass = 'frontend';
    tags = 'react, ui, javascript';
  } else if (lower.includes('docker') || lower.includes('oci') || lower.includes('deploy') || lower.includes('devops') || lower.includes('nginx')) {
    category = 'DevOps';
    badgeClass = 'devops';
    tags = 'devops, cloud, container';
  } else if (lower.includes('python') || lower.includes('data') || lower.includes('model') || lower.includes('ml')) {
    category = 'Data Science';
    badgeClass = 'datascience';
    tags = 'python, kmeans, tfidf';
  } else if (lower.includes('android') || lower.includes('ios') || lower.includes('flutter') || lower.includes('app')) {
    category = 'Mobile';
    badgeClass = 'mobile';
    tags = 'android, ios, app';
  }

  // Simulated HTTP latency
  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    id: Date.now(),
    title: docTitle,
    category,
    badgeClass,
    confidence,
    tags,
    date: 'Hace un momento',
  };
}
