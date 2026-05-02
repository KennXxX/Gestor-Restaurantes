import { useEffect, useState } from 'react'
import { getReviews, deleteReview } from '../../shared/api/reviews'
import { showError, showSuccess } from '../../shared/utils/toast'

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data
  if (data?.errors && data.errors.length > 0) {
    return data.errors[0].message
  }
  return data?.message || error?.message || fallback
}

export const Resenas = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)

  const loadReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getReviews()
      setReviews(data?.reviews || [])
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las reseñas.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleDelete = async (review) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta reseña?')) return
    
    try {
      await deleteReview(review._id)
      showSuccess('Reseña eliminada.')
      setSelectedReview(null)
      await loadReviews()
    } catch (err) {
      showError(getErrorMessage(err, 'No se pudo eliminar la reseña.'))
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-amber-400' : 'text-slate-200'}`}>
        ★
      </span>
    ))
  }

  return (
    <section className="space-y-6 font-body">
      <header className="relative overflow-hidden rounded-[30px] border border-violet-200 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.15),_transparent_60%),linear-gradient(120deg,_#f5f3ff_0%,_#ede9fe_50%,_#ddd6fe_100%)] p-8 shadow-sm">
        <div className="absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-violet-300/40 blur-3xl" />
        <div className="relative">
          <p className="inline-flex rounded-full bg-violet-700 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-violet-50">
            Reseñas
          </p>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Feedback y calificaciones
          </h1>
          <p className="mt-3 text-sm text-slate-700 sm:text-base max-w-2xl">
            Revisa los comentarios que los usuarios han dejado sobre restaurantes o platillos específicos.
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-slate-900 border-b border-slate-100 pb-5">Listado de reseñas</h2>

          <div className="mt-6 space-y-4">
            {loading && <p className="text-center text-sm text-slate-500 py-6">Cargando comentarios...</p>}
            {!loading && error && <p className="text-center text-sm text-rose-500 py-6">{error}</p>}
            {!loading && !error && reviews.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-6">Aún no hay reseñas registradas.</p>
            )}

            {!loading && reviews.length > 0 && (
              <div className="grid gap-4">
                {reviews.map(review => (
                  <article 
                    key={review._id} 
                    onClick={() => setSelectedReview(review)}
                    className={`rounded-[26px] border p-5 shadow-sm transition cursor-pointer hover:border-violet-300 ${selectedReview?._id === review._id ? 'border-violet-400 bg-violet-50/50' : 'border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-800">{review.userName || 'Usuario Anónimo'}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {review.restaurantId ? `Restaurante: ${review.restaurantId.restaurantName || 'Desconocido'}` : ''}
                          {review.menuId ? `Platillo: ${review.menuId.menuName || 'Desconocido'}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">{renderStars(review.rating)}</div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">{review.comment || 'Sin comentario adicional.'}</p>
                    <p className="mt-3 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h2 className="font-display text-xl font-semibold text-slate-900 mb-6">Detalle de reseña</h2>
            
            {selectedReview ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Usuario</p>
                  <p className="font-medium text-slate-900 text-lg mt-1">{selectedReview.userName}</p>
                </div>

                <div className="flex gap-1">
                  {renderStars(selectedReview.rating)}
                </div>

                {selectedReview.restaurantId && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Restaurante</p>
                    <p className="font-medium text-slate-800 mt-1">{selectedReview.restaurantId.restaurantName}</p>
                  </div>
                )}

                {selectedReview.menuId && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Platillo evaluado</p>
                    <p className="font-medium text-slate-800 mt-1">{selectedReview.menuId.menuName}</p>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Comentario</p>
                  <p className="text-sm text-slate-700 italic">"{selectedReview.comment || 'Sin comentario.'}"</p>
                </div>

                <button 
                  onClick={() => handleDelete(selectedReview)}
                  className="w-full mt-4 rounded-2xl bg-rose-50 text-rose-600 font-semibold py-3 border border-rose-200 hover:bg-rose-100 transition"
                >
                  Eliminar reseña
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-500 mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-sm text-slate-500">Selecciona una reseña de la lista para ver el detalle y opciones.</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  )
}
