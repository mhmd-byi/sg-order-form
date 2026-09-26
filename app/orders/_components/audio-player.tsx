export function AudioPlayer({ src, className }: { src: string; className?: string }) {
  return (
    <audio controls preload="none" src={src} className={`h-9 max-w-full ${className ?? ""}`}>
      Your browser can&apos;t play this audio format.
    </audio>
  );
}
