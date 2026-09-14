/**
 * The mark: a lantern.
 *
 * A warm point of light in the dark is what the hero footage is about and
 * what the product is — so it needs no explanation, which is the bar a logo
 * has to clear. Its hue is sampled from the lanterns in the clip and sits
 * opposite --accent on the hue circle.
 *
 * Deliberately steady, not pulsing: `live-dot` already pulses in session rows
 * and the session header to mean "this is running". A second pulsing dot in
 * the nav would read as a status light rather than a mark.
 *
 * The glow is two shadows rather than one — a tight bloom for the source and
 * a wide, faint one for the mist around it. A single shadow reads as a
 * sticker; two reads as light falling off.
 */
export function LanternMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-lantern ${className}`}
      style={{
        boxShadow:
          "0 0 10px 1px oklch(0.76 0.14 80 / 0.55), 0 0 26px 6px oklch(0.76 0.14 80 / 0.20)",
      }}
    />
  );
}
