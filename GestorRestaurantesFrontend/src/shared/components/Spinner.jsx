export const Spinner = ({ label = 'Cargando...' }) => {
  return (
    <div className="spinner-shell" aria-live="polite">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}
