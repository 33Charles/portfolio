// Fixed, static, and rendered once at the App root — never re-renders, no scroll cost.
export default function Background() {
  return (
    <div className="site-bg" aria-hidden="true">
      <div className="site-bg__grid" />
      <div className="site-bg__glow site-bg__glow--a" />
      <div className="site-bg__glow site-bg__glow--b" />
      <div className="site-bg__grain" />
    </div>
  )
}
