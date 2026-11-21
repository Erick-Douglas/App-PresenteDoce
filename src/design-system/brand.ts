/** WCAG contrast for the white lettering used throughout the storefront. */
export function readableBrand(color: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return false;
  const rgb = [1, 3, 5]
    .map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return (
    1.05 / (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 + 0.05) >= 4.5
  );
}
