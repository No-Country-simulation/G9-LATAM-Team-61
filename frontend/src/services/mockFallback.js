/**
 * Local Demo Simulation Fallback (Pure client-side isolated inference)
 */
import { sanitizeInput, inferTitleFromContent, INITIAL_DOCUMENTS, INITIAL_CLUSTERS } from './apiClient.js';

export async function runLocalClassificationSimulation(formData) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const text = (formData.content || '').toLowerCase();
  let category = 'Otros';
  let probability = 0.75;
  let rawTags = ['general', 'documento'];

  if (text.includes('docker') || text.includes('kubernetes') || text.includes('oci') || text.includes('ci/cd') || text.includes('pipeline') || text.includes('nginx')) {
    category = 'DevOps';
    probability = 0.95;
    rawTags = ['oci', 'docker', 'ci-cd', 'devops'];
  } else if (text.includes('spring') || text.includes('postgres') || text.includes('jpa') || text.includes('sql') || text.includes('jwt') || text.includes('api')) {
    category = 'Backend';
    probability = 0.92;
    rawTags = ['spring-boot', 'postgres', 'jpa', 'jwt'];
  } else if (text.includes('react') || text.includes('vite') || text.includes('hook') || text.includes('css') || text.includes('html') || text.includes('frontend')) {
    category = 'Frontend';
    probability = 0.96;
    rawTags = ['react', 'vite', 'hooks', 'frontend'];
  } else if (text.includes('python') || text.includes('fastapi') || text.includes('machine learning') || text.includes('kmeans') || text.includes('tf-idf') || text.includes('data')) {
    category = 'Data Science';
    probability = 0.89;
    rawTags = ['python', 'kmeans', 'tf-idf', 'machine-learning'];
  } else if (text.includes('android') || text.includes('ios') || text.includes('flutter') || text.includes('mobile')) {
    category = 'Mobile';
    probability = 0.88;
    rawTags = ['mobile', 'flutter', 'app'];
  }

  return {
    id: Date.now(),
    title: sanitizeInput(inferTitleFromContent(formData.content)),
    content: sanitizeInput(formData.content),
    category,
    confidence: `${(probability * 100).toFixed(1)}%`,
    probability,
    tags: rawTags.join(', '),
    date: 'Hace un momento',
    latencyMs: 18.2,
    isLiveApi: false,
  };
}

export function getMockHistory(categoryFilter = '') {
  if (!categoryFilter) return { items: INITIAL_DOCUMENTS, totalElements: INITIAL_DOCUMENTS.length };
  const filtered = INITIAL_DOCUMENTS.filter(
    (d) => d.category && d.category.toLowerCase() === categoryFilter.toLowerCase()
  );
  return { items: filtered, totalElements: filtered.length };
}

export function getMockRecommendations(id) {
  return INITIAL_DOCUMENTS.filter((d) => d.id !== id).slice(0, 3);
}

export function getMockClusters() {
  return {
    n_clusters: INITIAL_CLUSTERS.length,
    n_documentos: 0,
    clusters: INITIAL_CLUSTERS,
    tiempo_procesamiento_ms: 350.0,
  };
}
