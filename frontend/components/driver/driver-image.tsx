import { useState } from "react";
import Image from "next/image"

export const DriverAvatar = ({ src, alt }: { src: string, alt: string }) => {
  const [error, setError] = useState(false);
  const fallback = "https://www.formula1.com/content/dam/fom-website/drivers/driver_fallback.png";

  return (
    <div className="relative h-32 w-32">
      <Image
        src={error ? fallback : src}
        alt={alt}
        fill
        unoptimized
        className="object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
};