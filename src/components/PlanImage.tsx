import { useState } from "react";

interface PlanImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Image with graceful fallback. Plan URLs may not exist for every apartment/floor.
 */
export function PlanImage({ src, alt = "", className = "", fallback }: PlanImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      draggable={false}
    />
  );
}
