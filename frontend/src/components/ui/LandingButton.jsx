export default function LandingButton({
  label     = "Login",
  bgColor   = "#ffffff",
  textColor = "#1b4332",
  baseColor = "#1b4332",
  onClick,
  style = {},
  disabled = false,
  type = "button",
}) {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        backgroundColor: bgColor,
        color: textColor,
        borderColor: baseColor,
        ...style,
      }}
      className="relative w-full h-[38px] cursor-pointer select-none rounded-md border px-4 py-1.5 font-jakarta text-[13.5px] font-semibold transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-smooth motion-reduce:transition-none hover-only:hover:opacity-90 enabled:motion-safe:active:scale-[0.97] active:opacity-100 disabled:cursor-not-allowed flex items-center justify-center shadow-none"
      onClick={handleClick}
    >
      <span>{label}</span>
    </button>
  );
}
