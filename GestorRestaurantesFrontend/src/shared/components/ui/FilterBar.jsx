import React from 'react'

export const FilterBar = ({
  searchTerm,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchPlaceholder = 'Buscar...',
  hideDateFilters = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 w-full mt-4 mb-2">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Búsqueda General
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {!hideDateFilters && (
        <>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </>
      )}
      <div className="w-full sm:w-auto">
        <button
          type="button"
          onClick={() => {
            onSearchChange('')
            if (!hideDateFilters) {
              onStartDateChange('')
              onEndDateChange('')
            }
          }}
          title="Limpiar filtros"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
