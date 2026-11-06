// Same Twitch.Embed setup as the World Tour director. This document's short URL
// prevents the SDK from copying a complete broadcast snapshot into its referrer.
const query = new URLSearchParams(window.location.search);
const channel = query.get("channel") || "";
const video = query.get("video") || "";
const startWithApi = query.get("start") === "api";
const status = document.getElementById("status");
const message = document.getElementById("message");
const retry = document.getElementById("retry");
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
        autoplay: !startWithApi,
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
            embed.getPlayer().play();
          } catch {
            fail();
          }
        });
      }
      status.hidden = true;
    } catch {
      fail();
    }
  });
  document.head.appendChild(script);
}
