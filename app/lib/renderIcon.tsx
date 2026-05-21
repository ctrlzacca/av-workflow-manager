export function renderIcon(
  icon: string,
  isImage?: boolean,
  size: string = "w-4 h-4",
  alwaysWhite?: boolean
) {
  if (isImage && icon?.startsWith("/")) {
    return (
      <img
        src={icon}
        alt=""
        className={`${size} object-contain ${alwaysWhite ? "icon-always-white" : "dark-icon"}`}
      />
    );
  }
  return <span>{icon || "📁"}</span>;
}