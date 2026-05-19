import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/store/authStore'

export const RestaurantTables = () => {
  const user = useAuthStore((state) => state.user)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tableName: '',
    tableCapacity: 2,
  })

  useEffect(() => {
    // TODO: Cargar mesas del restaurante específico
    // const loadTables = async () => {
    //   try {
    //     const { data } = await getTables({ restaurantId: user?.restaurantId })
    //     setTables(data?.data || [])
    //   } catch (err) {
    //     console.error(err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // loadTables()
    setLoading(false)
  }, [user?.restaurantId])

  const handleAddTable = () => {
    // TODO: Crear nueva mesa
    console.log('Crear mesa:', formData)
    setShowModal(false)
    setFormData({ tableName: '', tableCapacity: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestión de Mesas</h2>
          <p className="mt-2 text-slate-500">Administra las mesas de tu restaurante</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          + Nueva Mesa
        </button>
      </div>

      {/* Tables List */}
      {loading ? (
        <div className="text-center text-slate-500">Cargando mesas...</div>
      ) : tables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-500">No tienes mesas registradas aún.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition"
          >
            Crear primera mesa
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div key={table._id} className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{table.tableName}</h3>
                  <p className="mt-1 text-sm text-slate-500">Capacidad: {table.tableCapacity} personas</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  table.tableActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}>
                  {table.tableActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900">Nueva Mesa</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nombre de la Mesa</label>
                <input
                  type="text"
                  value={formData.tableName}
                  onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                  placeholder="Ej: Mesa 1, VIP 1"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Capacidad (personas)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.tableCapacity}
                  onChange={(e) => setFormData({ ...formData, tableCapacity: parseInt(e.target.value) })}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
              >
                Crear Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
