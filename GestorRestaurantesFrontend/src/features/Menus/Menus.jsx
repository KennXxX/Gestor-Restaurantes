import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../../shared/api/restaurants'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../shared/api/menus'
import { getInventories, createInventory, updateInventory } from '../../shared/api/inventory'
import { showError, showSuccess } from '../../shared/utils/toast'
import { FilterBar } from '../../shared/components/ui/FilterBar'

// Design tokens (mismo estilo que el dashboard)
const C = {
  bg: "#0c0f18",
  surface: "#111827",
  surfaceHover: "#161d2e",
  border: "rgba(255,255,255,0.07)",
  borderAccent: "rgba(59,130,246,0.25)",
  accent: "#1d4ed8",
  accentLight: "#3b82f6",
  accentDim: "rgba(59,130,246,0.7)",
  text: "#f5f0e8",
  textMuted: "rgba(255,255,255,0.45)",
  textDim: "rgba(255,255,255,0.25)",
}

const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: "16px",
  padding: "20px",
}

const label = {
  fontSize: "0.6rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.accentDim,
  margin: "0 0 6px",
}

const emptyForm = {
  menuName: '',
  menuDescription: '',
  menuPrice: '',
  menuCategory: 'PLATO_FUERTE',
  restaurantId: '',
  menuActive: true,
  menuPhoto: null,
  stockQuantity: '0' 
}

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Menus = () => {
  const [menus, setMenus] = useState([])
  const [inventories, setInventories] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMenus = useMemo(() => {
    return menus.filter(menu => {
      const searchLower = searchTerm.toLowerCase()
      const name = menu.menuName || ''
      const category = menu.menuCategory || ''
      const price = String(menu.menuPrice || '')

      return !searchTerm || 
        name.toLowerCase().includes(searchLower) ||
        category.toLowerCase().includes(searchLower) ||
        price.toLowerCase().includes(searchLower)
    })
  }, [menus, searchTerm])

  const stats = useMemo(() => {
    return {
      total: filteredMenus.length,
      active: filteredMenus.filter(m => m.menuActive !== false).length,
      inactive: filteredMenus.filter(m => m.menuActive === false).length
    }
  }, [filteredMenus])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [restRes, menusRes, invRes] = await Promise.all([
        getRestaurants({ limit: 100 }),
        getMenus().catch(() => ({ data: { menus: [] } })),
        getInventories().catch(() => ({ data: { inventories: [] } }))
      ])
      
      setRestaurants(restRes.data?.data || [])
      setMenus(menusRes.data?.menus || [])
      setInventories(invRes.data?.inventories || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target

    if (type === 'file') {
      const file = files?.[0] || null
      setForm(prev => ({ ...prev, menuPhoto: file }))
      setPhotoPreview(file ? URL.createObjectURL(file) : null)
      return
    }

    if (name === 'menuActive') {
      setForm(prev => ({ ...prev, menuActive: value === 'true' }))
      return
    }

    setForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setPhotoPreview(null)
  }

  const handleEdit = (menu) => {
    setEditing(menu)
    const menuInventory = inventories.find(inv => inv.menuId === menu._id)
    
    setForm({
      menuName: menu.menuName || '',
      menuDescription: menu.menuDescription || '',
      menuPrice: menu.menuPrice || '',
      menuCategory: menu.menuCategory || 'PLATO_FUERTE',
      restaurantId: menu.restaurantId?._id || menu.restaurantId || '',
      menuActive: menu.menuActive !== false,
      menuPhoto: null,
      stockQuantity: menuInventory ? String(menuInventory.quantity) : '0'
    })
    setPhotoPreview(menu.menuPhoto || null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.menuName || !form.menuPrice || !form.restaurantId) {
      showError('Nombre, precio y restaurante son obligatorios.')
      return
    }

    setSaving(true)
    try {
      const menuPayload = {
        menuName: form.menuName,
        menuDescription: form.menuDescription,
        menuPrice: form.menuPrice,
        menuCategory: form.menuCategory,
        restaurantId: form.restaurantId,
        menuActive: form.menuActive,
        menuPhoto: form.menuPhoto
      }

      const inventoryPayload = {
        menuId: editing?._id,
        restaurantId: form.restaurantId,
        quantity: Number(form.stockQuantity) || 0
      }

      if (editing) {
        await updateMenu(editing._id, menuPayload)
        
        const menuInventory = inventories.find(inv => inv.menuId === editing._id)
        if (menuInventory) {
          await updateInventory(menuInventory._id, { quantity: inventoryPayload.quantity })
        } else {
          await createInventory(inventoryPayload)
        }
        
        showSuccess('Menú y stock actualizados.')
      } else {
        const createdMenuRes = await createMenu(menuPayload)
        const createdMenuId = createdMenuRes.data?.menu?._id
        
        if (createdMenuId) {
           await createInventory({
             menuId: createdMenuId,
             restaurantId: form.restaurantId,
             quantity: Number(form.stockQuantity) || 0
           })
        }
        
        showSuccess('Menú y stock creados.')
      }
      resetForm()
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar el menú.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (menu) => {
    if (!window.confirm('¿Seguro que deseas eliminar este menú?')) return
    try {
      await deleteMenu(menu._id)
      showSuccess('Menú eliminado.')
      await loadData()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar el menú.'))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Hero Banner */}
      <section style={{
        position: "relative", overflow: "hidden", borderRadius: "20px",
        background: "linear-gradient(135deg, #0d1526 0%, #111c30 50%, #0e1a28 100%)",
        border: `1px solid ${C.borderAccent}`,
        padding: "32px 36px",
        animation: "fadeUp 0.4s ease both",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.06), 0 24px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #1d4ed8, #3b82f6, #1d4ed8, transparent)",
        }} />
        <div style={{ position: "absolute", right: "-60px", top: "-20px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)", pointerEvents: "none" }} />
        
        <div style={{ position: "relative" }}>
          <p style={{ ...label, marginBottom: "8px" }}>Gestión de platillos</p>
          <h1 style={{ margin: "0 0 12px", fontSize: "2.2rem", fontWeight: 800, color: C.text, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Catálogo de <span style={{
              background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}>menús</span>
          </h1>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", maxWidth: "500px", lineHeight: 1.6 }}>
            Crea y administra los platillos, asocia ingredientes simulados del inventario y define categorías y precios.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.55fr 1fr" }}>
        {/* Left Column - Menu List */}
        <section style={{ ...card, animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <p style={label}>Listado de platillos</p>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                Todos los platillos
              </h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ padding: "4px 12px", borderRadius: "100px", background: "rgba(59,130,246,0.1)", border: `1px solid ${C.borderAccent}`, fontSize: "0.7rem", color: C.accentDim }}>
                Total: {stats.total}
              </span>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "20px" }}>
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textDim }}>Activos</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#22c55e", letterSpacing: "-0.03em" }}>{stats.active}</p>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
              <p style={{ margin: "0 0 2px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textDim }}>Inactivos</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: C.textMuted, letterSpacing: "-0.03em" }}>{stats.inactive}</p>
            </div>
          </div>

          {/* FilterBar */}
          <div style={{ marginBottom: "20px" }}>
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar por nombre, categoría o precio..."
              hideDateFilters={true}
            />
          </div>

          {/* Menu List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  border: `2px solid ${C.border}`, borderTopColor: C.accentLight,
                  animation: "spin 0.8s linear infinite"
                }} />
                <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: 0 }}>Cargando menús...</p>
              </div>
            )}
            
            {!loading && error && (
              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}
            
            {!loading && !error && filteredMenus.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: `1px dashed ${C.border}` }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: C.textMuted }}>No hay platillos que coincidan con la búsqueda.</p>
              </div>
            )}

            {!loading && filteredMenus.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredMenus.map(menu => {
                  const menuStock = inventories.find(inv => inv.menuId === menu._id)?.quantity || 0
                  
                  return (
                    <article key={menu._id} style={{
                      padding: "16px", borderRadius: "16px",
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                      transition: "all 0.2s ease", display: "flex", gap: "16px",
                      alignItems: "flex-start"
                    }}>
                      {menu.menuPhoto ? (
                        <img src={menu.menuPhoto} alt={menu.menuName} style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover", background: "rgba(255,255,255,0.05)" }} />
                      ) : (
                        <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "rgba(59,130,246,0.1)", border: `1px solid ${C.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: C.accentLight }}>
                          {menu.menuName.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.text }}>{menu.menuName}</h3>
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#22c55e" }}>Q{menu.menuPrice}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 500, color: C.accentDim }}>{menu.menuCategory}</p>
                        <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: C.textMuted }}>
                          Stock: <span style={{ color: menuStock > 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>{menuStock} {menuStock === 1 ? 'unidad' : 'unidades'}</span>
                        </p>
                        <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: C.textMuted, lineHeight: 1.4 }}>{menu.menuDescription}</p>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            onClick={() => handleEdit(menu)} 
                            style={{
                              padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600,
                              background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                              color: C.textMuted, cursor: "pointer", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = C.text }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.textMuted }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(menu)} 
                            style={{
                              padding: "6px 14px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600,
                              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                              color: "#f87171", cursor: "pointer", transition: "all 0.2s ease"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column - Form */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section style={{ ...card, animation: "fadeUp 0.4s ease both", animationDelay: "0.16s" }}>
            <p style={label}>{editing ? 'Editar platillo' : 'Nuevo platillo'}</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {editing ? 'Editar platillo' : 'Crear nuevo platillo'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Nombre del platillo *</label>
                <input 
                  name="menuName" 
                  value={form.menuName} 
                  onChange={handleInputChange}
                  style={{
                    padding: "12px 16px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: "0.875rem", outline: "none"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accentLight}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                  required 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Precio (Q) *</label>
                  <input 
                    type="number" 
                    name="menuPrice" 
                    value={form.menuPrice} 
                    onChange={handleInputChange}
                    style={{
                      padding: "12px 16px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                      color: C.text, fontSize: "0.875rem", outline: "none"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accentLight}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                    required 
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Categoría</label>
                  <select 
                    name="menuCategory" 
                    value={form.menuCategory} 
                    onChange={handleInputChange}
                    style={{
                      padding: "12px 16px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                      color: C.text, fontSize: "0.875rem", outline: "none", cursor: "pointer"
                    }}
                  >
                    <option value="ENTRADA" style={{ background: C.surface }}>Entrada</option>
                    <option value="PLATO_FUERTE" style={{ background: C.surface }}>Plato Fuerte</option>
                    <option value="POSTRE" style={{ background: C.surface }}>Postre</option>
                    <option value="BEBIDA" style={{ background: C.surface }}>Bebida</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Restaurante *</label>
                <select 
                  name="restaurantId" 
                  value={form.restaurantId} 
                  onChange={handleInputChange}
                  style={{
                    padding: "12px 16px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: "0.875rem", outline: "none", cursor: "pointer"
                  }}
                  required
                >
                  <option value="" style={{ background: C.surface }}>Selecciona uno</option>
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id} style={{ background: C.surface }}>{r.restaurantName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Stock (Cantidad disponible)</label>
                <input 
                  type="number" 
                  min="0" 
                  name="stockQuantity" 
                  value={form.stockQuantity} 
                  onChange={handleInputChange} 
                  placeholder="0"
                  style={{
                    padding: "12px 16px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: "0.875rem", outline: "none"
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accentLight}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
                <span style={{ fontSize: "0.7rem", color: C.textDim }}>La cantidad se actualizará directamente en el inventario.</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMuted }}>Foto del platillo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleInputChange}
                  style={{
                    padding: "8px 12px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                    color: C.text, fontSize: "0.75rem"
                  }}
                />
              </div>
              
              {photoPreview && (
                <img src={photoPreview} alt="Preview" style={{ height: "128px", width: "100%", objectFit: "cover", borderRadius: "12px", border: `1px solid ${C.border}` }} />
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button 
                  type="submit" 
                  disabled={saving} 
                  style={{
                    flex: 1, padding: "14px 20px", borderRadius: "14px",
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                    border: "none", color: "white", fontWeight: 700,
                    fontSize: "0.875rem", cursor: "pointer", opacity: saving ? 0.6 : 1,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.3)" } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                {editing && (
                  <button 
                    type="button" 
                    onClick={resetForm} 
                    style={{
                      padding: "14px 20px", borderRadius: "14px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                      color: C.textMuted, fontWeight: 600, fontSize: "0.875rem",
                      cursor: "pointer", transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = C.text }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.textMuted }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        </aside>
      </div>
    </div>
  )
}