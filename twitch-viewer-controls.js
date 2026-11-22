export function twitchViewerQuality(available, requested) {
  const names = (available || []).map(value => typeof value === "string" ? value : value?.group).filter(Boolean);
  if (requested === "720p" || requested === "480p")
    return names.find(name => new RegExp(`^${requested}(?:\\d+)?$`, "i").test(name)) || "auto";
  return "auto";
}

/** Visibility suspension resumes only playback that this controller paused. */
export function createTwitchViewerController(getPlayer) {
  let ready = false, preferences = {}, suspended = false, resume = false, appliedQuality;
  function apply() {
    if (!ready) return;
    const player = getPlayer();
    if (preferences.quality !== undefined) {
      try {
        const quality = twitchViewerQuality(player.getQualities(), preferences.quality);
        if (quality !== appliedQuality) {
          player.setQuality(quality);
          appliedQuality = quality;
        }
      } catch { /* Visibility pausing still works if qualities are unavailable. */ }
    }
    if (preferences.paused && !suspended) {
      resume = !player.isPaused();
      player.pause();
      suspended = true;
    } else if (!preferences.paused && suspended) {
      suspended = false;
      if (resume) player.play();
      resume = false;
    }
  }
  return {
    update(value) {
      preferences = {
        paused: value.paused === true,
        ...(value.quality === "auto" || value.quality === "720p" || value.quality === "480p"
          ? { quality: value.quality } : {}),
      };
      apply();
    },
    ready() { ready = true; apply(); },
  };
}
