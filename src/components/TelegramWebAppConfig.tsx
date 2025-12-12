import { useEffect } from 'react';

export default function TelegramWebAppConfig() {
  useEffect(() => {
    // Add meta tags for full-screen mobile experience (Safari, Chrome, etc.)
    const meta = [
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#000000' },
      { name: 'apple-mobile-web-app-title', content: 'Trading App' },
      { name: 'format-detection', content: 'telephone=no' },
    ];

    const existingMetas = document.querySelectorAll('meta[name]');
    const existingMetaNames = new Set(
      Array.from(existingMetas).map(m => m.getAttribute('name'))
    );

    meta.forEach(({ name, content }) => {
      if (!existingMetaNames.has(name)) {
        const metaTag = document.createElement('meta');
        metaTag.name = name;
        metaTag.content = content;
        document.head.appendChild(metaTag);
      } else {
        const existingMeta = document.querySelector(`meta[name="${name}"]`);
        if (existingMeta) {
          existingMeta.setAttribute('content', content);
        }
      }
    });

    // Add link tags for iOS home screen
    const addAppleTouchIcon = (sizes: string, href: string) => {
      const existing = document.querySelector(`link[rel="apple-touch-icon"][sizes="${sizes}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        link.sizes = sizes;
        link.href = href;
        document.head.appendChild(link);
      }
    };

    // Add placeholder icons (you can replace with real icons later)
    addAppleTouchIcon('180x180', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

    // Add manifest link for PWA
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (!existingManifest) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    // Prevent default touch behaviors
    const preventDefault = (e: Event) => {
      if ((e.target as HTMLElement).closest('[data-scrollable]')) {
        return; // Allow scroll in designated areas
      }
      e.preventDefault();
    };

    // Add to document level
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);

    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
    };
  }, []);

  return null;
}