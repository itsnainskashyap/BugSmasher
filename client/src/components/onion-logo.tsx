interface OnionLogoProps {
  size?: number;
  className?: string;
}

export default function OnionLogo({ size = 40, className = "" }: OnionLogoProps) {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      data-testid="logo-onion"
    >
      <div 
        className="absolute rounded-full border-2 border-primary bg-primary opacity-20"
        style={{
          width: size,
          height: size,
        }}
      />
      <div 
        className="absolute rounded-full border-2 border-primary bg-primary opacity-50"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          top: size * 0.15,
          left: size * 0.15,
        }}
      />
      <div 
        className="absolute rounded-full border-2 border-primary bg-primary opacity-80"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          top: size * 0.3,
          left: size * 0.3,
        }}
      />
    </div>
  );
}
