import Image from "next/image";

/** The same SVG is used here and as the browser favicon. */
export function SafeWebMark() {
  return (
    <Image
      src="/safeweb-mark.svg"
      width={18}
      height={18}
      alt=""
      aria-hidden="true"
      className="shrink-0"
      unoptimized
    />
  );
}
