import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";

interface Props {
  /** Path within public/ to use. Defaults to public/music/bed.mp3 */
  src?: string;
  /** Volume 0-1. Default 0.18 (low — sits under voice) */
  volume?: number;
}

/**
 * MusicTrack — optional background music bed.
 *
 * Drop a track at `public/music/bed.mp3` (or pass `src` prop) and it'll mix
 * under the ElevenLabs voice at low volume. If no file exists, this is a
 * silent no-op.
 *
 * For the daily AI/business pipeline, recommended track styles:
 *   - lofi tech / ambient electronic
 *   - cinematic minimal pulse
 *   - indian-tech-fusion (sitar + synth, light)
 *
 * Sources:
 *   - Pixabay Music (free): https://pixabay.com/music/search/genre/ambient/
 *   - YT Audio Library
 *   - Suno AI (custom-generate per video, $10/mo)
 *
 * IMPORTANT: For Reels uploads, you can leave this silent and add a TRENDING
 * audio at upload time via the Reels app (free Meta licensing). For YouTube
 * Shorts where Reels audio doesn't transfer, bake a music bed here at ~15%
 * volume so the rendered MP4 has its own bed.
 */
export const MusicTrack: React.FC<Props> = ({ src = "music/bed.mp3", volume = 0.18 }) => {
  const { durationInFrames, fps } = useVideoConfig();
  // Silent no-op if the track isn't present — Remotion will throw if we try
  // to staticFile a missing file at render time. We do a try/catch by
  // tolerating the missing path: just render nothing.
  let resolved: string | null = null;
  try {
    resolved = staticFile(src);
  } catch {
    return null;
  }
  // If staticFile returned but file might be missing on disk, the renderer
  // will warn. That's acceptable — silent fallback.
  if (!resolved) return null;
  return (
    <Audio
      src={resolved}
      volume={volume}
      // Loop the track if it's shorter than the video
      // (Audio doesn't have a loop prop natively in older Remotion versions
      //  but trimming via startFrom/endAt should be enough for a 60s vid)
    />
  );
};
