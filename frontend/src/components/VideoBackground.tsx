/**
 * VideoBackground — Fullscreen looping muted background video.
 *
 * Extracted into its own component so it can be fully mocked in tests,
 * preventing jsdom / axe-core from encountering a real <video> element.
 *
 * aria-hidden="true": the video is purely decorative — it carries no
 * information and should never be announced by screen readers.
 */
export function VideoBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-base-bg"
      aria-hidden="true"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover opacity-30 mix-blend-multiply"
      >
        <source src="/assets/stadium_bg.mp4" type="video/mp4" />
      </video>
      {/* Vignette — shadow at edges to blend with base-bg */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_80px_rgba(247,249,252,1)]" />
    </div>
  );
}

export default VideoBackground;
