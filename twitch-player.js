import { createTwitchViewerController } from "./twitch-viewer-controls.js";
// Same Twitch.Embed setup as the World Tour director. This document's short URL
// prevents the SDK from copying a complete broadcast snapshot into its referrer.
const query = new URLSearchParams(window.location.search);
const channel = query.get("channel") || "";
const video = query.get("video") || "";
const startWithApi = query.get("start") === "api";
const status = document.getElementById("status");
const message = document.getElementById("message");
const retry = document.getElementById("retry");
let viewerController, viewerPreferences;
window.addEventListener("message", event => {
  if (event.origin !== window.location.origin || event.source !== window.parent ||
      event.data?.type !== "conquest-viewer-preferences") return;
  viewerPreferences = event.data;
  try { viewerController?.update(viewerPreferences); } catch { /* Twitch may still be initializing. */ }
});
retry.addEventListener("click", () => window.location.reload());
function fail() {
  status.hidden = false;
  message.textContent = "Twitch could not be loaded. Retry the player.";
  retry.hidden = false;
}
if (!/^[a-z0-9_]{1,25}$/i.test(channel) && !/^\d{1,20}$/.test(video)) {
  message.textContent = "Use a valid Twitch channel or video link.";
} else {
  const timeout = setTimeout(fail, 15000);
  const script = document.createElement("script");
  script.src = "https://embed.twitch.tv/embed/v1.js";
  script.addEventListener("error", () => {
    clearTimeout(timeout);
    fail();
  });
  script.addEventListener("load", () => {
    clearTimeout(timeout);
    try {
      const embed = new window.Twitch.Embed("player", {
        width: "100%",
        height: "100%",
        layout: "video",
        autoplay: true,
        muted: query.get("muted") !== "false",
        theme: "dark",
        parent: [window.location.hostname || "localhost"],
        ...(channel ? { channel } : { video }),
      });
      if (startWithApi) {
        // Use the documented VIDEO_READY -> getPlayer().play() startup for
        // director feeds instead of autoplay's one-time visibility gate.
        // Run once: later manual pauses must remain paused.
        let started = false;
        embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
          if (started) return;
          started = true;
          try {
            if(query.get("muted")!=="false")embed.getPlayer().setMuted?.(true);
            embed.getPlayer().play();
          } catch {
            fail();
          }
        });
      }
      viewerController = createTwitchViewerController(() => embed.getPlayer());
      if (viewerPreferences) viewerController.update(viewerPreferences);
      embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        try { viewerController.ready(); } catch { /* Native Twitch controls remain available. */ }
        const player = embed.getPlayer();
        player.addEventListener(window.Twitch.Player.PLAYING, () => {
          try { viewerController.ready(); } catch { /* Qualities may change when a stream starts. */ }
        });
      });
      status.hidden = true;
    } catch {
      fail();
    }
  });
  document.head.appendChild(script);
}
