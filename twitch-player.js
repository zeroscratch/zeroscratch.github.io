// Same Twitch.Embed setup as the World Tour director. This document's short URL
// prevents the SDK from copying a complete broadcast snapshot into its referrer.
const query = new URLSearchParams(window.location.search);
const channel = query.get("channel") || "";
const video = query.get("video") || "";
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
  script.addEventListener("error", () => { clearTimeout(timeout); fail(); });
  script.addEventListener("load", () => {
    clearTimeout(timeout);
    try {
      new window.Twitch.Embed("player", {
        width: "100%",
        height: "100%",
        layout: "video",
        autoplay: true,
        muted: query.get("muted") !== "false",
        theme: "dark",
        parent: [window.location.hostname || "localhost"],
        ...(channel ? { channel } : { video }),
      });
      status.hidden = true;
    } catch { fail(); }
  });
  document.head.appendChild(script);
}
