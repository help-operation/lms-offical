import Image from "next/image";

type Props = {
  lightSrc: string;
  darkSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

/** Renders the site logo, swapping to a dark-mode variant via CSS `dark:` classes (no JS/hydration needed). */
export function SiteLogo({ lightSrc, darkSrc, alt, width = 140, height = 40, className, priority }: Props) {
  if (!darkSrc || darkSrc === lightSrc) {
    return <Image src={lightSrc} alt={alt} width={width} height={height} className={className} priority={priority} />;
  }

  return (
    <>
      <Image src={lightSrc} alt={alt} width={width} height={height} className={`${className ?? ""} dark:hidden`} priority={priority} />
      <Image src={darkSrc} alt={alt} width={width} height={height} className={`hidden dark:block ${className ?? ""}`} priority={priority} />
    </>
  );
}
