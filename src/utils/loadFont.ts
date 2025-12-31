/**
 * Loads Open Sans font from Google Fonts only if it's not already loaded
 */
export const loadOpenSansFont = (): void => {
  // Check if Open Sans is already loaded from Google Fonts
  const isFontAlreadyLoaded = (): boolean => {
    // Check if there's already a Google Fonts link for Open Sans in the document
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (href.includes('fonts.googleapis.com') && href.includes('Open+Sans')) {
        return true;
      }
    }

    // Check if Open Sans font face is already defined using FontFaceSet API
    try {
      if ('fonts' in document) {
        const fontFaces = Array.from(document.fonts);
        for (const font of fontFaces) {
          if (font.family.includes('Open Sans')) {
            return true;
          }
        }
      }
    } catch (e) {
      // FontFaceSet API not available or error occurred
      console.debug('[KZChatbot] FontFaceSet API not available:', e);
    }

    return false;
  };

  const alreadyLoaded = isFontAlreadyLoaded();

  if (!alreadyLoaded) {
    // Font is not loaded, load it from Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap';
    document.head.appendChild(link);
    console.debug('[KZChatbot] Loading Open Sans font from Google Fonts');
  } else {
    console.debug('[KZChatbot] Open Sans font already loaded, skipping');
  }
};

