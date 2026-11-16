import { useEffect, useState } from "react";

export default function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("ip_install_dismissed") === "1") {
      setDismissed(true);
      return undefined;
    }
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      sessionStorage.setItem("ip_install_dismissed", "1");
      setDismissed(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed) return null;

  async function handleInstall() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => null);
    if (choice && choice.outcome === "accepted") {
      sessionStorage.setItem("ip_install_dismissed", "1");
      setDismissed(true);
    }
    setPromptEvent(null);
  }

  function handleDismiss() {
    sessionStorage.setItem("ip_install_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-body">
        <span className="install-prompt-title">Use it like an app</span>
        <span className="install-prompt-text">
          Install the portal to your home screen to open it full-screen, with its own icon.
        </span>
      </div>
      <div className="install-prompt-actions">
        {promptEvent ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleInstall}>
            Install app
          </button>
        ) : (
          <button type="button" className="link-btn" onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? "Hide instructions" : "How to install"}
          </button>
        )}
        <button type="button" className="install-prompt-x" onClick={handleDismiss} aria-label="Dismiss">
          &times;
        </button>
      </div>
      {showHelp && !promptEvent && (
        <div className="install-help">
          <p>
            <strong>Android / Chrome:</strong> tap the menu (&#8942;) and choose "Add to Home screen" or
            "Install app".
          </p>
          <p>
            <strong>iPhone / iPad (Safari):</strong> tap the Share button and choose "Add to Home Screen".
          </p>
        </div>
      )}
    </div>
  );
}