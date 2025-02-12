document.addEventListener("DOMContentLoaded", () => {
    // Create and append the overlay widget script
    const overlayScript = document.createElement("script");
    overlayScript.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    document.body.appendChild(overlayScript);

    // Create and append the inline script for configuration
    const inlineScript = document.createElement("script");
    inlineScript.textContent = `
    kofiWidgetOverlay.draw('nerdymomocat', {
      'type': 'floating-chat',
      'floating-chat.donateButton.text': 'Support Me',
      'floating-chat.donateButton.background-color': '#FEA97F',
      'floating-chat.donateButton.text-color': '#000'
    });
  `;
    document.body.appendChild(inlineScript);
});
