// Service layer for KMS Inference API (POST /api/contenido)

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
