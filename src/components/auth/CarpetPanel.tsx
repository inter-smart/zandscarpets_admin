const Logo = "/zands-logo.svg";

export function CarpetPanel() {
  return (
    <aside className="flex h-24 items-center justify-center bg-gradient-to-br from-[#023260] via-[#0066B3] to-[#4a2a8f] px-6 text-center text-white lg:h-auto lg:px-12">
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
          <img src={Logo} alt="Z&S Carpets" className="h-8 w-auto lg:h-12" />
        </div>
        <div className="hidden space-y-2 lg:block">
          <h2 className="text-2xl font-semibold">Z&S Carpets</h2>
          {/* <p className="text-sm text-white/80">Admin Console</p> */}
        </div>
        <p className="hidden text-xs text-white/50 lg:block">© {new Date().getFullYear()} Z&S. All rights reserved.</p>
      </div>
    </aside>
  );
}
