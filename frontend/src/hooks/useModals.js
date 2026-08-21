import { useState, useEffect, useCallback } from 'react';
import { fetchRecommendations } from '../services/kmsApi';

/**
 * Custom Hook for Modal Management & Contextual Payloads
 */
export function useModals(showToast) {
  const [activeModal, setActiveModal] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Recommendations state
  const [recommendedBaseDoc, setRecommendedBaseDoc] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const openResultModal = useCallback((data) => {
    setResultData(data);
    setActiveModal('result');
  }, []);

  const openRecommendationsModal = useCallback(
    async (doc) => {
      setRecommendedBaseDoc(doc);
      setIsLoadingRecommendations(true);
      setActiveModal('recommended');

      try {
        const recs = await fetchRecommendations(doc.id);
        setRecommendations(recs);
      } catch {
        if (showToast) {
          showToast('No se pudieron obtener recomendaciones para este documento', 'error');
        }
        setRecommendations([]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    },
    [showToast]
  );

  return {
    activeModal,
    setActiveModal,
    closeModal,
    resultData,
    openResultModal,
    recommendedBaseDoc,
    recommendations,
    isLoadingRecommendations,
    openRecommendationsModal,
  };
}

export default useModals;
