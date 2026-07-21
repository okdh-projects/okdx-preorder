export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="./images/logo.png"
      alt="OKDX.Merch"
      width={size}
      height={size}
      className="rounded-full bg-white object-cover"
      style={{ width: size, height: size }}
    />
  );
}
