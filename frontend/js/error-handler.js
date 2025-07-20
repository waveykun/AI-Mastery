// frontend/js/error-handler.js (Corrected Version)
window.addEventListener('error', (event) => {
    console.error('Application render error:', event.error);
    if (window.AIMasteryApp) {
        window.AIMasteryApp.showError('An unexpected error occurred in the interface.');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.AIMasteryApp) {
        window.AIMasteryApp.showWarning('A background operation failed.');
    }
});

// This check is a failsafe, though the main app handles it.
if (!window.fetch) {
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h2>Browser Not Supported</h2><p>This application requires a modern browser environment.</p></div>';
}