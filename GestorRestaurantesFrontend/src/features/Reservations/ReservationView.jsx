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
import { useLocation, useSearchParams } from 'react-router-dom'
import { getErrorMessage, toInputDateTime, formatDate, STATUS_LABEL, STATUS_COLORS } from './utils/reservationHelpers'
import { AvailabilityBadge } from './components/Client/AvailabilityBadge'
import { StepDot } from './components/Client/StepDot'
import { MyReservationsList } from './components/Client/MyReservationsList'
import { ClientHistory } from '../History/ClientHistory'
import { ClientReservationModal } from './components/Client/ClientReservationModal'

// ─── helpers ────────────────────────────────────────────────────────────────

const emptyForm = {
  restaurantId: '',
  tableId: [],
  numberPeople: 2,
  typeReservation: 'PERSONAL',
  description: '',
  coupon: '',
  startDate: '',
  endDate: '',
  photo: null,
}

// ─── sub-components ──────────────────────────────────────────────────────────

const inputCls = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100'
const labelCls = 'flex flex-col text-sm font-semibold text-slate-700'

// ─── main component ───────────────────────────────────────────────────────────

export const ReservationView = () => {
  const location = useLocation();
  const prefillRestaurantId = location.state?.prefillRestaurantId || '';
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeViewTab, setActiveViewTab] = useState('RESERVATIONS'); // 'RESERVATIONS' or 'HISTORY'
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...emptyForm, restaurantId: prefillRestaurantId })
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(Boolean(prefillRestaurantId))

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

  useEffect(() => {
    const couponParam = searchParams.get('coupon')
    if (!couponParam) return

    setForm((prev) => ({ ...prev, coupon: couponParam }))
    setIsModalOpen(true)
    setStep(1)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('coupon')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

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

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setStep(1); setConflict(null); setIsModalOpen(false); }

  const startEdit = (res) => {
    setEditingId(res._id)
    setDetailId(null)
    setForm({
      restaurantId: res.restaurantId?._id || res.restaurantId || '',
      tableId: (res.tableId || []).map((t) => t._id || t),
      numberPeople: res.numberPeople || 2,
      typeReservation: res.typeReservation || 'PERSONAL',
      description: res.description || '',
      coupon: res.coupon || '',
      startDate: toInputDateTime(res.startDate),
      endDate: toInputDateTime(res.endDate),
      photo: null,
    })
    setStep(1)
    setIsModalOpen(true)
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
      coupon: form.coupon?.trim() || undefined,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-50">
              🗓️ Reservaciones
            </p>
            <h1 className="font-display mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">
              ¡Reserva tu mesa!
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Administra tus reservaciones activas o revisa tu historial de actividad.
            </p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-sky-500 transition-all shrink-0"
          >
            + Nueva Reserva
          </button>
        </div>
        <div className="mt-6 flex border-b border-sky-200/50">
          <button 
            onClick={() => setActiveViewTab('RESERVATIONS')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeViewTab === 'RESERVATIONS' ? 'text-sky-800 border-b-2 border-sky-600' : 'text-sky-700/60 hover:text-sky-700'}`}
          >
            Mis Reservas
          </button>
          <button 
            onClick={() => setActiveViewTab('HISTORY')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeViewTab === 'HISTORY' ? 'text-sky-800 border-b-2 border-sky-600' : 'text-sky-700/60 hover:text-sky-700'}`}
          >
            Historial
          </button>
        </div>
      </header>

      <div className="w-full">
        {activeViewTab === 'RESERVATIONS' ? (
          <MyReservationsList
            myReservations={myReservations}
            loadingMy={loadingMy}
            loadMyReservations={loadMyReservations}
            detailId={detailId}
            setDetailId={setDetailId}
            detailReservation={detailReservation}
            startEdit={startEdit}
            handleCancel={handleCancel}
          />
        ) : (
          <ClientHistory />
        )}

        <ClientReservationModal
          isOpen={isModalOpen}
          onClose={() => { resetForm(); setIsModalOpen(false); }}
          step={step}
          setStep={setStep}
          form={form}
          setForm={setForm}
          goNext={goNext}
          handleSubmit={handleSubmit}
          saving={saving}
          checking={checking}
          conflict={conflict}
          filteredTables={filteredTables}
          selectedRestaurant={selectedRestaurant}
          loadingTables={loadingTables}
          restaurants={restaurants}
          tables={tables}
          editingId={editingId}
          toggleTable={toggleTable}
        />
      </div>
    </section>
  )
}
