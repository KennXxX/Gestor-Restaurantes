import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRestaurants } from '../../shared/api/restaurants'
import { getTables } from '../../shared/api/tables'
import {
  cancelReservation,
  createReservation,
  getMyReservations,
  updateReservation,
} from '../../shared/api/reservations'
import { showError, showSuccess } from '../../shared/utils/toast'

// ─── helpers ────────────────────────────────────────────────────────────────

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data
  if (data?.errors?.length) return data.errors[0].message
  return data?.message || err?.message || fallback
}

const toInputDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_LABEL = { PENDIENTE: 'Pendiente', COMPLETADO: 'Completada', CANCELADO: 'Cancelada' }
const STATUS_COLORS = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  COMPLETADO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  CANCELADO: 'bg-rose-100 text-rose-600 border border-rose-200',
}

const emptyForm = {
  restaurantId: '',
  tableId: [],
  numberPeople: 2,
  typeReservation: 'PERSONAL',
  description: '',
  startDate: '',
  endDate: '',
  photo: null,
}

// ─── sub-components ──────────────────────────────────────────────────────────

const StepDot = ({ n, active, done }) => (
  <div
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all
      ${done ? 'border-sky-600 bg-sky-600 text-white' : active ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-slate-200 bg-white text-slate-400'}`}
  >
    {done ? '✓' : n}
  </div>
)

const AvailabilityBadge = ({ checking, conflict }) => {
  if (checking)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Verificando disponibilidad…
      </span>
    )
  if (conflict === null) return null
  if (conflict)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
        ✕ Horario con conflicto
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      ✓ Horario disponible
    </span>
  )
}

const inputCls = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'

// ─── main component ───────────────────────────────────────────────────────────

export const ReservationView = () => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [restaurants, setRestaurants] = useState([])
  const [tables, setTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)

  const [myReservations, setMyReservations] = useState([])
  const [loadingMy, setLoadingMy] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [detailId, setDetailId] = useState(null)

  const [checking, setChecking] = useState(false)
  const [conflict, setConflict] = useState(null)
  const debounceRef = useRef(null)

  // ── load data ─────────────────────────────────────────────────────────────
  const loadMyReservations = useCallback(async () => {
    setLoadingMy(true)
    try {
      const { data } = await getMyReservations()
      setMyReservations(data?.reservations || [])
    } catch (_err) {
      /* silent – user may not have reservations yet */
    } finally {
      setLoadingMy(false)
    }
  }, [])

  useEffect(() => {
    getRestaurants({ restaurantActive: true, limit: 100 })
      .then(({ data }) => setRestaurants(data?.data || []))
      .catch(() => {})
    loadMyReservations()
  }, [loadMyReservations])

  // ── load tables on restaurant change ─────────────────────────────────────
  useEffect(() => {
    if (!form.restaurantId) { setTables([]); return }
    let cancelled = false
    setLoadingTables(true)
    setForm((p) => ({ ...p, tableId: [] }))
    setConflict(null)
    getTables({ restaurantId: form.restaurantId, tableActive: true, limit: 100 })
      .then(({ data }) => { if (!cancelled) setTables(data?.data || []) })
      .catch(() => { if (!cancelled) setTables([]) })
      .finally(() => { if (!cancelled) setLoadingTables(false) })
    return () => { cancelled = true }
  }, [form.restaurantId])

  // ── real-time availability ────────────────────────────────────────────────
  useEffect(() => {
    const { tableId, startDate, endDate, restaurantId } = form
    if (!tableId.length || !startDate || !endDate || !restaurantId) { setConflict(null); return }
    clearTimeout(debounceRef.current)
    setChecking(true)
    debounceRef.current = setTimeout(() => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) { setConflict(null); setChecking(false); return }
      const hasConflict = myReservations.some((r) => {
        if (r.status === 'CANCELADO') return false
        if (editingId && r._id === editingId) return false
        const rStart = new Date(r.startDate)
        const rEnd = new Date(r.endDate)
        const tableOverlap = (r.tableId || []).some((t) => tableId.includes(t._id || t))
        return tableOverlap && start < rEnd && end > rStart
      })
      setConflict(hasConflict)
      setChecking(false)
    }, 500)
  }, [form.tableId, form.startDate, form.endDate, form.restaurantId, myReservations, editingId])

  // ── derived ───────────────────────────────────────────────────────────────
  const filteredTables = useMemo(
    () => tables.filter((t) => Number(t.tableCapacity || 0) >= Number(form.numberPeople || 1)),
    [tables, form.numberPeople]
  )

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r._id === form.restaurantId),
    [restaurants, form.restaurantId]
  )

  const detailReservation = useMemo(
    () => myReservations.find((r) => r._id === detailId),
    [myReservations, detailId]
  )

  // ── helpers ───────────────────────────────────────────────────────────────
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  const toggleTable = (id) => {
    const t = tables.find((x) => x._id === id)
    if (t && Number(t.tableCapacity || 0) < Number(form.numberPeople || 1)) {
      showError(`La mesa "${t.tableName}" no soporta ${form.numberPeople} personas.`)
      return
    }
    setForm((p) => ({
      ...p,
      tableId: p.tableId.includes(id) ? p.tableId.filter((x) => x !== id) : [...p.tableId, id],
    }))
  }

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setStep(1); setConflict(null) }

  const startEdit = (res) => {
    setEditingId(res._id)
    setDetailId(null)
    setForm({
      restaurantId: res.restaurantId?._id || res.restaurantId || '',
      tableId: (res.tableId || []).map((t) => t._id || t),
      numberPeople: res.numberPeople || 2,
      typeReservation: res.typeReservation || 'PERSONAL',
      description: res.description || '',
      startDate: toInputDateTime(res.startDate),
      endDate: toInputDateTime(res.endDate),
      photo: null,
    })
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── validation ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.restaurantId) { showError('Selecciona un restaurante.'); return false }
    if (!form.startDate || !form.endDate) { showError('Indica fecha y hora de inicio y fin.'); return false }
    if (new Date(form.endDate) <= new Date(form.startDate)) { showError('La fecha de fin debe ser posterior al inicio.'); return false }
    if (form.typeReservation === 'EVENTO' && !form.description.trim()) { showError('Las reservas de tipo Evento requieren descripción.'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.tableId.length) { showError('Selecciona al menos una mesa.'); return false }
    if (conflict) { showError('Hay un conflicto de horario. Cambia el horario o la mesa.'); return false }
    return true
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return
    setSaving(true)
    const payload = {
      restaurantId: form.restaurantId,
      tableId: form.tableId,
      numberPeople: Number(form.numberPeople) || 1,
      typeReservation: form.typeReservation,
      description: form.description,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      photo: form.photo,
    }
    try {
      if (editingId) {
        await updateReservation(editingId, payload)
        showSuccess('Reserva actualizada correctamente.')
      } else {
        await createReservation(payload)
        showSuccess('¡Reserva creada! Te esperamos.')
      }
      resetForm()
      await loadMyReservations()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo guardar la reservación.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (res) => {
    if (!window.confirm('¿Deseas cancelar esta reservación?')) return
    try {
      await cancelReservation(res._id)
      showSuccess('Reservación cancelada.')
      setDetailId(null)
      await loadMyReservations()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo cancelar la reservación.'))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6 font-body">

      {/* HEADER */}
      <header className="relative overflow-hidden rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.22),_transparent_60%),linear-gradient(120deg,_#f0f9ff_0%,_#e0f2fe_60%,_#bae6fd_100%)] p-8 shadow-sm">
        <div className="absolute right-8 top-8 text-6xl opacity-10 select-none">🍽️</div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-50">
          🗓️ Reservaciones
        </p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
          {editingId ? '✏️ Editar reserva' : '¡Reserva tu mesa!'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Solo 3 pasos: elige restaurante y horario, selecciona tu mesa y confirma. ¡Es muy fácil!
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[['1️⃣','Elige fecha y restaurante'],['2️⃣','Selecciona tu mesa'],['3️⃣','Confirma y listo']].map(([icon, txt]) => (
            <span key={txt} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-sky-800 shadow-sm">{icon} {txt}</span>
          ))}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

        {/* WIZARD */}
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">

          {/* Steps indicator */}
          <div className="mb-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center">
              {[['🗓️','Detalles'],['🪑','Mesa'],['✅','Confirmar']].map(([icon, label], i) => (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg transition-all
                      ${step > i + 1 ? 'border-sky-600 bg-sky-600 text-white' : step === i + 1 ? 'border-sky-500 bg-white text-xl shadow-md shadow-sky-100' : 'border-slate-200 bg-white text-slate-300'}`}>
                      {step > i + 1 ? '✓' : icon}
                    </div>
                    <span className={`text-xs font-semibold ${step === i + 1 ? 'text-sky-600' : step > i + 1 ? 'text-sky-400' : 'text-slate-400'}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`mx-2 h-0.5 flex-1 rounded-full transition-all duration-500 ${step > i + 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">Paso {step} de 3</p>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-slate-900">Selecciona restaurante y horario</h2>

              <label className={labelCls}>
                Restaurante
                <select id="rv-restaurant" className={inputCls} value={form.restaurantId} onChange={(e) => set('restaurantId', e.target.value)}>
                  <option value="">— Elige un restaurante —</option>
                  {restaurants.map((r) => <option key={r._id} value={r._id}>{r.restaurantName}</option>)}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>
                  Fecha y hora de inicio
                  <input id="rv-start" type="datetime-local" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className={labelCls}>
                  Fecha y hora de fin
                  <input id="rv-end" type="datetime-local" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelCls}>
                  Número de personas
                  <input id="rv-people" type="number" min="1" max="50" className={inputCls} value={form.numberPeople} onChange={(e) => set('numberPeople', e.target.value)} />
                </label>
                <label className={labelCls}>
                  Tipo de reserva
                  <select id="rv-type" className={inputCls} value={form.typeReservation} onChange={(e) => set('typeReservation', e.target.value)}>
                    <option value="PERSONAL">Personal</option>
                    <option value="EVENTO">Evento</option>
                  </select>
                </label>
              </div>

              <label className={labelCls}>
                Descripción{' '}
                {form.typeReservation === 'EVENTO' && (
                  <span className="ml-1 text-xs font-normal text-rose-500">*requerida para eventos</span>
                )}
                <textarea
                  id="rv-desc"
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Ej: Cumpleaños, reunión de negocios, aniversario…"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </label>

              <label className={labelCls}>
                Foto (opcional)
                <input id="rv-photo" type="file" accept="image/*" className="mt-1.5 w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500" onChange={(e) => set('photo', e.target.files?.[0] || null)} />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Cancelar edición
                  </button>
                )}
                <button type="button" onClick={goNext} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                  Siguiente → Seleccionar mesa
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-900">Elige tu mesa</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Mesas con capacidad ≥ {form.numberPeople} personas en{' '}
                    <strong>{selectedRestaurant?.restaurantName || 'el restaurante'}</strong>
                  </p>
                </div>
                <AvailabilityBadge checking={checking} conflict={conflict} />
              </div>

              {loadingTables && (
                <div className="flex flex-col items-center gap-3 py-10 text-slate-400">
                  <span className="text-4xl animate-pulse">🪑</span>
                  <p className="text-sm">Cargando mesas disponibles…</p>
                </div>
              )}
              {!loadingTables && !form.restaurantId && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400">
                  <span className="text-4xl">🏠</span>
                  <p className="text-sm font-medium">Vuelve al paso anterior</p>
                  <p className="text-xs">Debes seleccionar un restaurante primero</p>
                </div>
              )}
              {!loadingTables && form.restaurantId && filteredTables.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 py-10">
                  <span className="text-4xl">😕</span>
                  <p className="text-sm font-semibold text-amber-700">Sin mesas disponibles</p>
                  <p className="text-xs text-amber-600">No hay mesas para {form.numberPeople} personas. Reduce el número de personas e intenta de nuevo.</p>
                </div>
              )}

              {!loadingTables && filteredTables.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTables.map((t) => {
                    const selected = form.tableId.includes(t._id)
                    const cap = Number(t.tableCapacity || 0)
                    const peopleIcons = '👤'.repeat(Math.min(cap, 6)) + (cap > 6 ? `+${cap - 6}` : '')
                    return (
                      <button
                        key={t._id}
                        type="button"
                        id={`rv-table-${t._id}`}
                        onClick={() => toggleTable(t._id)}
                        className={`flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md
                          ${selected ? 'border-sky-500 bg-sky-50 shadow-sm shadow-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900">🪑 {t.tableName || `Mesa ${t._id.slice(-4)}`}</p>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                            ${selected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {selected ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-base leading-tight">{peopleIcons}</p>
                        <p className="text-xs font-medium text-slate-500">Capacidad: {cap} {cap === 1 ? 'persona' : 'personas'}</p>
                        {selected && <p className="text-xs font-semibold text-sky-600">✔ Seleccionada</p>}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  ← Atrás
                </button>
                <button type="button" onClick={goNext} className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                  Siguiente → Confirmar
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-900">¡Casi listo!</h2>
                  <p className="text-sm text-slate-500">Revisa los detalles y confirma tu reservación</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                {[
                  ['🏠', 'Restaurante', selectedRestaurant?.restaurantName || '—'],
                  ['📅', 'Entrada', formatDate(form.startDate)],
                  ['🕐', 'Salida', formatDate(form.endDate)],
                  ['👥', 'Personas', `${form.numberPeople} ${Number(form.numberPeople) === 1 ? 'persona' : 'personas'}`],
                  ['🎉', 'Tipo', form.typeReservation === 'PERSONAL' ? 'Personal' : 'Evento especial'],
                  ['🪑', 'Mesas', form.tableId.map((id) => { const t = tables.find((x) => x._id === id); return t ? t.tableName || `Mesa ${id.slice(-4)}` : id }).join(', ')],
                  ...(form.description ? [['📝', 'Nota', form.description]] : []),
                ].map(([icon, label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0 text-sm">
                    <span className="flex items-center gap-2 text-slate-500 shrink-0"><span>{icon}</span>{label}</span>
                    <span className="text-right font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>

              <AvailabilityBadge checking={checking} conflict={conflict} />

              {!conflict && !checking && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                  🟢 Todo listo. Al confirmar, recibirás tu reservación con estado <strong>Pendiente</strong>.
                </div>
              )}

              <div className="flex justify-between gap-3 pt-1">
                <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  ← Modificar
                </button>
                <button
                  type="button"
                  disabled={saving || !!conflict || checking}
                  onClick={handleSubmit}
                  className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-500 disabled:opacity-50 transition-all"
                >
                  {saving ? '⏳ Guardando…' : editingId ? '💾 Actualizar reserva' : '🎉 ¡Confirmar reserva!'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* MIS RESERVAS */}
        <aside>
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900">📋 Mis reservaciones</h2>
                <p className="text-xs text-slate-400 mt-0.5">{myReservations.length} en total</p>
              </div>
              <button type="button" onClick={loadMyReservations} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">↻ Actualizar</button>
            </div>

            {loadingMy && (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                <span className="text-3xl animate-pulse">⏳</span>
                <p className="text-sm">Cargando tus reservaciones…</p>
              </div>
            )}
            {!loadingMy && myReservations.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50 py-10">
                <span className="text-5xl">🗓️</span>
                <p className="text-sm font-semibold text-sky-700">Sin reservaciones aún</p>
                <p className="text-xs text-sky-500 text-center px-4">Usa el formulario de la izquierda para crear tu primera reserva.</p>
              </div>
            )}

            <div className="space-y-3">
              {!loadingMy && myReservations.map((res) => {
                const borderColor = res.status === 'PENDIENTE' ? 'border-l-amber-400' : res.status === 'COMPLETADO' ? 'border-l-emerald-400' : 'border-l-rose-400'
                return (
                  <article key={res._id} className={`rounded-2xl border border-slate-100 border-l-4 ${borderColor} bg-white p-4 shadow-sm transition hover:shadow-md`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">🏠 {res.restaurantId?.restaurantName || 'Restaurante'}</p>
                        <p className="mt-1 text-xs text-slate-500">📅 {formatDate(res.startDate)}</p>
                        <p className="text-xs text-slate-500">🕐 hasta {formatDate(res.endDate)}</p>
                        <p className="mt-1 text-xs text-slate-400">👥 {res.numberPeople} {res.numberPeople === 1 ? 'persona' : 'personas'} · {res.typeReservation}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[res.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[res.status] || res.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setDetailId(detailId === res._id ? null : res._id)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                        {detailId === res._id ? '▲ Ocultar' : '▼ Ver detalle'}
                      </button>
                      {res.status === 'PENDIENTE' && (
                        <>
                          <button type="button" onClick={() => startEdit(res)} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100">✏️ Editar</button>
                          <button type="button" onClick={() => handleCancel(res)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100">✕ Cancelar</button>
                        </>
                      )}
                    </div>

                    {detailId === res._id && detailReservation && (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                        {[
                          ['🪑 Mesas', (res.tableId || []).map((t) => t.tableName || t._id || t).join(', ') || '—'],
                          ['📝 Descripción', res.description || 'Sin descripción'],
                          ['📌 Estado', STATUS_LABEL[res.status] || res.status],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-2 text-xs">
                            <span className="text-slate-500">{label}</span>
                            <span className="text-right font-medium text-slate-700">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
