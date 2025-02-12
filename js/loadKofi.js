document.addEventListener("DOMContentLoaded", () => {
    // Create and append the overlay widget script with an onload callback
    const overlayScript = document.createElement("script");
    overlayScript.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    overlayScript.onload = () => {
        kofiWidgetOverlay.draw('nerdymomocat', {
            'type': 'floating-chat',
            'floating-chat.donateButton.text': 'Support Me',
            'floating-chat.donateButton.background-color': '#FEA97F',
            'floating-chat.donateButton.text-color': '#000'
        });
    };
    document.body.appendChild(overlayScript);
});
