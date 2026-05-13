export function renderIcon(
  icon: string,
  isImage?: boolean,
  size: string = "w-4 h-4"
) {
  if (isImage && icon?.startsWith("/")) {
    return (
      <img
        src={icon}
        alt=""
        className={`${size} object-contain invert opacity-70`}
      />
    );
  }

  return <span>{icon || "📁"}</span>;
}