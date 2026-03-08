import { useState, useEffect } from 'react';

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Listen for navigation events
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href && !link.href.startsWith('#') && !link.target) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          setLoading(true);
          setProgress(0);
          
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval);
                return 90;
              }
              return prev + Math.random() * 30;
            });
          }, 100);
        }
      }
    };

    const handlePopState = () => {
      setLoading(true);
      setProgress(0);
    };

    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', handlePopState);

    window.addEventListener('load', () => {
      setTimeout(() => {
        setLoading(false);
        setProgress(100);
      }, 500);
    });

    return () => {
      document.removeEventListener('click', handleLinkClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    setLoading(false);
    setProgress(100);
  }, [window.location.pathname]);

  if (!loading && progress === 100) return null;

  return (
    <div className="page-loader">
      <div className="page-loader__progress" style={{ width: `${progress}%` }}></div>
      <div className="page-loader__spinner">
        <i className="fas fa-paw fa-spin"></i>
      </div>
    </div>
  );
}
