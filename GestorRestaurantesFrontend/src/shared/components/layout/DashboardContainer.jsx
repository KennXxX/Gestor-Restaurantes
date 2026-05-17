import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"

export const DashboardContainer = ({ children, sidebarItems }) => {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0f18",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar items={sidebarItems} />
        <main style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 32px",
          overflowX: "hidden",
          background: "#0c0f18",
          position: "relative",
        }}>
          {/* Subtle ambient background */}
          <div style={{
            position: "fixed",
            top: "64px",
            left: "248px",
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: "radial-gradient(ellipse 60% 40% at 70% 20%, rgba(59,130,246,0.05) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(34,197,94,0.03) 0%, transparent 70%)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
