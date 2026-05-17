// FilterBar.jsx - Versión con estilo oscuro
import { useState } from 'react'

const C = {
  surface: "#111827",
  border: "rgba(255,255,255,0.07)",
  accentLight: "#3b82f6",
  text: "#f5f0e8",
  textMuted: "rgba(255,255,255,0.45)",
}

export const FilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder = "Buscar...",
  hideDateFilters = false 
}) => {
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
        <svg style={{ 
          position: "absolute", left: "12px", top: "50%", 
          transform: "translateY(-50%)", width: "16px", height: "16px", 
          color: C.textMuted 
        }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={{
            width: "100%", padding: "10px 12px 10px 36px",
            borderRadius: "12px", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`, color: C.text,
            fontSize: "0.875rem", outline: "none"
          }}
          onFocus={e => e.currentTarget.style.borderColor = C.accentLight}
          onBlur={e => e.currentTarget.style.borderColor = C.border}
        />
      </div>
    </div>
  )
}