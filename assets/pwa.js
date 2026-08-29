(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  const scriptURL = document.currentScript?.src ||
    document.querySelector('script[src*="assets/pwa.js"]')?.src ||
    new URL("assets/pwa.js", document.baseURI).href;
  const installButton = document.querySelector("#install-app");
  let deferredInstallPrompt = null;

  if (installButton) installButton.hidden = true;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  installButton?.addEventListener("click", async function () {
    if (!deferredInstallPrompt) return;
    installButton.disabled = true;
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      installButton.hidden = true;
      installButton.disabled = false;
    }
  });

  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  window.addEventListener("load", function () {
    // A relative URL keeps the registration scoped to the GitHub Pages project
    // subpath instead of assuming the site is hosted at the domain root.
    navigator.serviceWorker.register(new URL("../sw.js", scriptURL), {
      scope: new URL("../", scriptURL).href
    }).catch(function (error) {
      console.warn("PWA service worker registration failed:", error);
    });
  });
})();
