import { useEffect, useMemo, useState } from 'react'
import { exportInvoicePdf, getInvoices } from '../../shared/api/invoices'
import { showError, showSuccess } from '../../shared/utils/toast'

// ── Design tokens — violeta ───────────────────────────────────────────────────
const C = {
  bg:           "#0c0f18",
  surface:      "#111827",
  surfaceRaised:"#161f30",
  border:       "rgba(255,255,255,0.07)",
  borderAccent: "rgba(139,92,246,0.30)",
  accent:       "#7c3aed",
  accentLight:  "#a78bfa",
  accentDim:    "rgba(167,139,250,0.65)",
  accentGlow:   "rgba(139,92,246,0.10)",
  text:         "#f5f0e8",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.22)",
}

const labelStyle = {
  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: C.accentDim, margin: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getErr = (err, fb) => {
  const d = err?.response?.data
  if (d?.errors?.length) return d.errors[0].message
  return d?.message || err?.message || fb
}

const fmtCurrency = (v) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(Number(v || 0))

const fmtDate = (v) => {
  if (!v) return 'Sin fecha'
  const d = new Date(v)
  if (isNaN(d)) return 'Sin fecha'
  return d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

const fmtDateShort = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const isSameDay = (a, b) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

const statusConfig = (status) => {
  const map = {
    ENTREGADO:      { label: "Entregada",      bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.3)",  color: "#4ade80" },
    LISTO:          { label: "Lista",           bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.3)",  color: "#60a5fa" },
    EN_PREPARACION: { label: "En preparación", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
    CANCELADO:      { label: "Cancelada",       bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)",   color: "#f87171" },
  }
  return map[status] || { label: "Emitida", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.3)", color: "#a78bfa" }
}

const StatusBadge = ({ status }) => {
  const s = statusConfig(status)
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "100px", fontSize: "0.68rem", fontWeight: 700,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: "nowrap"
    }}>
      {s.label}
    </span>
  )
}

// ── Panel de detalle ──────────────────────────────────────────────────────────
const DetailPanel = ({ invoice, downloading, onDownload, onClose }) => {
  if (!invoice) return null
  const sc = statusConfig(invoice.rawStatus)

  const rows = [
    { label: "Cliente",       value: invoice.customer },
    { label: "Restaurante",   value: invoice.restaurant },
    { label: "Emisión",       value: invoice.issuedAt },
    { label: "Cupón",         value: invoice.coupon !== 'Sin cupón' ? invoice.coupon : null },
  ].filter(r => r.value)

  return (
    <aside style={{
      background: C.surface, border: `1px solid ${C.borderAccent}`,
      borderRadius: "18px", overflow: "hidden",
      position: "sticky", top: "24px", alignSelf: "start"
    }}>
      {/* Header con color de estado */}
      <div style={{
        padding: "20px 22px", borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(167,139,250,0.06) 100%)`,
        position: "relative"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, transparent)"
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "6px" }}>Factura seleccionada</p>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 900, color: C.text, fontFamily: "monospace", letterSpacing: "0.05em" }}>
              #{invoice.id}
            </h2>
            <StatusBadge status={invoice.rawStatus} />
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
            cursor: "pointer", color: C.textMuted, borderRadius: "8px", padding: "6px 8px", lineHeight: 1
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "0" }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            gap: "12px", padding: "9px 0",
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none"
          }}>
            <p style={{ ...labelStyle, flexShrink: 0 }}>{r.label}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: C.text, textAlign: "right" }}>{r.value}</p>
          </div>
        ))}
      </div>

      {/* Desglose financiero */}
      <div style={{ margin: "0 18px 18px", borderRadius: "14px", overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ background: C.accentGlow, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ ...labelStyle }}>Desglose financiero</p>
        </div>
        {[
          { label: "Subtotal",   value: invoice.subtotal,             color: C.text     },
          { label: "Base",       value: invoice.totalBeforeDiscount,  color: C.textMuted},
          { label: "Envío",      value: invoice.shippingFee,          color: C.textMuted},
          { label: "Descuento",  value: invoice.discountPercentage > 0 ? `-${invoice.discountPercentage}%` : "Sin descuento", color: invoice.discountPercentage > 0 ? "#4ade80" : C.textDim },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "9px 14px",
            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
            background: "rgba(255,255,255,0.015)"
          }}>
            <span style={{ fontSize: "0.75rem", color: C.textMuted }}>{row.label}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: row.color }}>{row.value}</span>
          </div>
        ))}

        {/* Total final destacado */}
        <div style={{
          padding: "12px 14px",
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.08))",
          borderTop: `1px solid ${C.borderAccent}`,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ ...labelStyle, color: C.accentLight }}>Total final</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: C.accentLight }}>{invoice.total}</span>
        </div>
      </div>

      {/* Botón descargar */}
      <div style={{ padding: "0 18px 18px" }}>
        <button
          onClick={() => onDownload(invoice)}
          disabled={!invoice.invoiceId || downloading === invoice.invoiceId}
          style={{
            width: "100%", padding: "12px", borderRadius: "12px",
            background: downloading === invoice.invoiceId
              ? "rgba(255,255,255,0.06)"
              : `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.85rem",
            cursor: (!invoice.invoiceId || downloading === invoice.invoiceId) ? "not-allowed" : "pointer",
            opacity: (!invoice.invoiceId || downloading === invoice.invoiceId) ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          {downloading === invoice.invoiceId ? (
            <>
              <div style={{
                width: "14px", height: "14px", borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                animation: "spin 0.8s linear infinite", flexShrink: 0
              }} />
              Descargando...
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export const Facturas = () => {
  const [invoices,    setInvoices]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [selected,    setSelected]    = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterStatus,setFilterStatus]= useState('all')

  const loadInvoices = async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await getInvoices()
      setInvoices(data?.invoices || [])
    } catch (err) {
      setError(getErr(err, 'No se pudieron cargar las facturas.'))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadInvoices() }, [])

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const handleDownload = async (invoice) => {
    if (!invoice?.invoiceId) { showError('No se encontró el ID de la factura.'); return }
    setDownloading(invoice.invoiceId)
    try {
      const res = await exportInvoicePdf(invoice.invoiceId)
      downloadBlob(res.data, `factura_${invoice.id || invoice.invoiceId}.pdf`)
      showSuccess('PDF descargado correctamente.')
    } catch (err) {
      showError(getErr(err, 'No se pudo descargar el PDF.'))
    } finally { setDownloading(null) }
  }

  // ── Filas procesadas ───────────────────────────────────────────────────────
  const invoiceRows = useMemo(() => invoices.map(inv => ({
    invoiceId:           inv._id,
    id:                  inv.invoiceNumber || inv._id,
    customer:            inv.customer?.name         || 'Sin cliente',
    restaurant:          inv.restaurantId?.restaurantName || 'Sin restaurante',
    issuedAt:            fmtDate(inv.issuedAt),
    issuedAtShort:       fmtDateShort(inv.issuedAt),
    totalBeforeDiscount: fmtCurrency(inv.totalBeforeDiscount),
    subtotal:            fmtCurrency(inv.subtotal),
    shippingFee:         fmtCurrency(inv.shippingFee),
    total:               fmtCurrency(inv.total),
    totalRaw:            Number(inv.total || 0),
    discountPercentage:  Number(inv.discountPercentage || 0),
    coupon:              inv.coupon || 'Sin cupón',
    rawStatus:           inv.orderId?.status,
    issuedAtRaw:         inv.issuedAt,
  })), [invoices])

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const now   = new Date()
    const today = invoiceRows.filter(r => r.issuedAtRaw && isSameDay(new Date(r.issuedAtRaw), now)).length
    const total = invoiceRows.reduce((a, r) => a + r.totalRaw, 0)
    const avg   = invoiceRows.length ? total / invoiceRows.length : 0
    const withDiscount = invoiceRows.filter(r => r.discountPercentage > 0).length
    return [
      { label: "Facturas totales",      value: invoiceRows.length,    accent: C.accentLight, sub: "registradas",     delay: 0.08 },
      { label: "Emitidas hoy",          value: today,                 accent: "#fbbf24",     sub: "en el día",       delay: 0.14 },
      { label: "Ingresos facturados",   value: fmtCurrency(total),    accent: "#34d399",     sub: "total acumulado", delay: 0.20 },
      { label: "Ticket promedio",       value: fmtCurrency(avg),      accent: "#f472b6",     sub: "por factura",     delay: 0.26 },
    ]
  }, [invoiceRows])

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return invoiceRows.filter(r => {
      if (filterStatus !== 'all' && r.rawStatus !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.customer.toLowerCase().includes(q) &&
          !r.restaurant.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [invoiceRows, search, filterStatus])

  const statuses = useMemo(() => {
    const set = new Set(invoiceRows.map(r => r.rawStatus).filter(Boolean))
    return ['all', ...set]
  }, [invoiceRows])

  const statusLabel = (s) => {
    if (s === 'all') return 'Todas'
    return statusConfig(s).label
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d0a1f 0%, #130f2a 50%, #0e0b1e 100%)",
        border: `1px solid ${C.borderAccent}`, padding: "32px 36px",
        animation: "fadeUp 0.4s ease both"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)"
        }} />
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px",
          borderRadius: "50%", background: "rgba(139,92,246,0.09)", filter: "blur(70px)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-50px", left: "25%", width: "180px", height: "180px",
          borderRadius: "50%", background: "rgba(124,58,237,0.05)", filter: "blur(50px)", pointerEvents: "none"
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>Administración financiera</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "2.1rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Panel de{" "}
              <span style={{
                background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite"
              }}>facturación</span>
            </h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.48)", maxWidth: "500px", lineHeight: 1.65 }}>
              Consulta comprobantes emitidos, revisa descuentos aplicados, monitorea ingresos y descarga PDFs de cada factura.
            </p>
          </div>
          <button onClick={loadInvoices} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "12px 26px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            border: "none", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)"
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(4,1fr)" }}>
        {kpis.map(s => (
          <div key={s.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${s.accent}`, borderRadius: "14px", padding: "18px 20px",
            animation: "fadeUp 0.4s ease both", animationDelay: `${s.delay}s`
          }}>
            <p style={{ ...labelStyle, color: `${s.accent}aa`, marginBottom: "8px" }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              <p style={{ margin: 0, fontSize: "1.7rem", fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: C.textDim }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de herramientas ── */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: "14px", padding: "14px 18px",
        display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center"
      }}>
        {/* Buscador */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            color: C.textMuted, width: "14px", height: "14px", pointerEvents: "none"
          }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente o restaurante..."
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: "10px",
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
              color: C.text, fontSize: "0.8rem", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Filtros por estado */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "6px 14px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
              background: filterStatus === s ? `linear-gradient(135deg, ${C.accent}, ${C.accentLight})` : "rgba(255,255,255,0.03)",
              border: filterStatus === s ? "none" : `1px solid ${C.border}`,
              color: filterStatus === s ? "white" : C.textMuted
            }}>
              {statusLabel(s)}
            </button>
          ))}
        </div>

        {search && (
          <span style={{ fontSize: "0.72rem", color: C.textDim, marginLeft: "auto" }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{
          padding: "14px 18px", borderRadius: "12px",
          background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171", fontSize: "0.85rem"
        }}>{error}</div>
      )}

      {/* ── Contenido principal ── */}
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: selected ? "1fr 340px" : "1fr" }}>

        {/* Tabla */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: "16px", overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px", gap: "14px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%",
                border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
                animation: "spin 0.8s linear infinite"
              }} />
              <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>Cargando facturas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "64px 20px", textAlign: "center" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 14px",
                background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem"
              }}>🧾</div>
              <p style={{ color: C.textMuted, fontSize: "0.875rem" }}>No hay facturas que coincidan.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: C.text }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Factura", "Cliente", "Restaurante", "Emisión", "Total", "Estado", ""].map(h => (
                      <th key={h} style={{
                        padding: "11px 14px", textAlign: "left", ...labelStyle,
                        color: C.textMuted, fontWeight: 700, whiteSpace: "nowrap"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const isSelected = selected?.invoiceId === inv.invoiceId
                    return (
                      <tr
                        key={inv.invoiceId}
                        onClick={() => setSelected(isSelected ? null : inv)}
                        style={{
                          borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                          background: isSelected ? C.accentGlow : "transparent",
                          transition: "background 0.1s"
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(139,92,246,0.04)" }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                      >
                        {/* Factura */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle", minWidth: "140px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                              background: C.accentGlow, border: `1px solid ${C.borderAccent}`,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem"
                            }}>🧾</div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: "0.78rem", fontFamily: "monospace" }}>
                                #{String(inv.id).slice(-8)}
                              </p>
                              {inv.coupon !== 'Sin cupón' && (
                                <p style={{ margin: 0, fontSize: "0.65rem", color: C.accentLight }}>
                                  🏷 {inv.coupon}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Cliente */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle", maxWidth: "150px" }}>
                          <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.customer}
                          </p>
                        </td>
                        {/* Restaurante */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle", maxWidth: "150px" }}>
                          <p style={{ margin: 0, color: C.textMuted, fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inv.restaurant}
                          </p>
                        </td>
                        {/* Emisión */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: C.textMuted }}>{inv.issuedAtShort}</p>
                        </td>
                        {/* Total */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <p style={{ margin: "0 0 2px", fontWeight: 800, color: C.accentLight, fontSize: "0.88rem" }}>
                            {inv.total}
                          </p>
                          {inv.discountPercentage > 0 && (
                            <p style={{ margin: 0, fontSize: "0.65rem", color: "#4ade80" }}>
                              -{inv.discountPercentage}% desc.
                            </p>
                          )}
                        </td>
                        {/* Estado */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle" }}>
                          <StatusBadge status={inv.rawStatus} />
                        </td>
                        {/* PDF */}
                        <td style={{ padding: "13px 14px", verticalAlign: "middle" }}
                          onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={!inv.invoiceId || downloading === inv.invoiceId}
                            style={{
                              padding: "5px 12px", borderRadius: "100px", fontSize: "0.68rem",
                              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                              border: `1px solid ${C.borderAccent}`,
                              background: downloading === inv.invoiceId ? "rgba(255,255,255,0.04)" : C.accentGlow,
                              color: C.accentLight,
                              opacity: (!inv.invoiceId || downloading === inv.invoiceId) ? 0.5 : 1,
                              display: "flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            {downloading === inv.invoiceId ? (
                              <div style={{
                                width: "10px", height: "10px", borderRadius: "50%",
                                border: "2px solid rgba(167,139,250,0.3)", borderTopColor: C.accentLight,
                                animation: "spin 0.8s linear infinite"
                              }} />
                            ) : (
                              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3"/>
                              </svg>
                            )}
                            {downloading === inv.invoiceId ? 'Descargando' : 'PDF'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        {selected && (
          <DetailPanel
            invoice={selected}
            downloading={downloading}
            onDownload={handleDownload}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
}
