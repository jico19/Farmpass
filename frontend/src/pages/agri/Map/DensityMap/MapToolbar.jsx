import { useRef, useState } from 'react';
import { Search, X, Upload, SlidersHorizontal, RotateCcw } from 'lucide-react';
import AnimatedCollapse from '../../../../components/motion/AnimatedCollapse';

const PERIODS = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
const control = 'min-h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700';

export default function MapToolbar({ map = [], filters, onOpenUpload }) {
    const [query, setQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const compareTriggerRef = useRef(null);
    const matches = map.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    return (
        <header className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-stone-800">Pig Population Map</h1>
                    <p className="mt-1 text-sm text-stone-600">Sariaya · {PERIODS[filters.selectedQuarter - 1] || 'Select a period'} {filters.selectedYear}</p>
                </div>
                <button type="button" onClick={onOpenUpload} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-bold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
                    <Upload size={16} /> Upload Survey
                </button>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-xs">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="relative min-w-0 flex-1 basis-48" onBlur={event => {
                        if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
                    }}>
                        <label htmlFor="barangay-search" className="mb-1 block text-xs font-medium text-stone-600">Barangay</label>
                        <div className="relative">
                            <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-stone-500" />
                            <input id="barangay-search" type="search" value={searchOpen ? query : filters.selectedBarangay || ''}
                                placeholder="Find barangay…" className={`${control} w-full pr-10 pl-9`}
                                onFocus={() => { setQuery(''); setSearchOpen(true); }}
                                onChange={event => { setQuery(event.target.value); setSearchOpen(true); }}
                                onKeyDown={event => {
                                    if (event.key === 'Escape') setSearchOpen(false);
                                    if (event.key === 'Enter' && matches.length === 1) {
                                        filters.setSelectedBarangay(matches[0].name);
                                        setSearchOpen(false);
                                    }
                                }} />
                            {filters.selectedBarangay && <button type="button" aria-label="Clear selected barangay" onClick={() => { filters.setSelectedBarangay(null); setQuery(''); }} className="absolute right-0 top-0 flex size-11 items-center justify-center text-stone-600"><X size={16} /></button>}
                        </div>
                        {searchOpen && <div className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
                            <button type="button" onClick={() => { filters.setSelectedBarangay(null); setSearchOpen(false); }} className="min-h-11 w-full rounded-md px-3 text-left text-sm font-semibold text-green-700 hover:bg-green-50">All barangays</button>
                            {matches.map(item => <button key={item.id} type="button" onClick={() => { filters.setSelectedBarangay(item.name); setSearchOpen(false); }} className="min-h-11 w-full rounded-md px-3 text-left text-sm hover:bg-stone-100 focus-visible:bg-green-50">{item.name}</button>)}
                            {!matches.length && <p className="p-3 text-sm text-stone-600">No matching barangays.</p>}
                        </div>}
                    </div>
                    <button type="button" aria-expanded={filtersOpen} aria-controls="map-period-filters" onClick={() => setFiltersOpen(!filtersOpen)} className={`${control} inline-flex items-center gap-2 md:hidden`}><SlidersHorizontal size={16} /> Filters</button>
                    <div id="map-period-filters" className={`${filtersOpen ? 'flex' : 'hidden'} w-full flex-wrap items-end gap-3 md:flex md:w-auto`}>
                        <label className="flex flex-col gap-1 text-xs font-medium text-stone-600">Year
                            <select value={filters.selectedYear} onChange={event => filters.setSelectedYear(event.target.value)} className={control}>
                                {!filters.years.length && <option value="">No periods</option>}
                                {filters.years.map(year => <option key={year}>{year}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-stone-600">Quarter
                            <select value={filters.selectedQuarter || ''} onChange={event => filters.setSelectedQuarter(event.target.value)} className={control}>
                                {!filters.selectedQuarter && <option value="">No periods</option>}
                                {PERIODS.map((period, index) => <option key={period} value={index + 1} disabled={!filters.availableQuarters.includes(index + 1)}>{period}{!filters.availableQuarters.includes(index + 1) ? ' · No data' : ''}</option>)}
                            </select>
                        </label>
                        <button type="button" ref={compareTriggerRef} aria-pressed={filters.isCompareMode} aria-expanded={filters.isCompareMode} aria-controls="map-comparison-controls" disabled={filters.years.length < 2} onClick={() => {
                            filters.setIsCompareMode(!filters.isCompareMode);
                        }} className={`${control} font-semibold disabled:opacity-50 ${filters.isCompareMode ? 'bg-green-50 text-green-700' : ''}`}>Compare years</button>
                        {filters.hasActiveFilters && <button type="button" onClick={filters.clearFilters} className={`${control} inline-flex items-center gap-2`}><RotateCcw size={16} /> Reset</button>}
                    </div>
                </div>
                <AnimatedCollapse id="map-comparison-controls" open={filters.isCompareMode}>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-3 text-sm text-stone-600">
                    <label className="flex items-center gap-2">Baseline year
                        <select value={filters.baselineYear} onChange={event => filters.setBaselineYear(event.target.value)} className={control}>
                            {filters.years.filter(year => year !== filters.selectedYear).map(year => <option key={year}>{year}</option>)}
                        </select>
                    </label>
                    <span>→ Target {filters.selectedYear} · Same quarter</span>
                    <button type="button" onClick={() => {
                        filters.setIsCompareMode(false);
                        compareTriggerRef.current?.focus({ preventScroll: true });
                    }} className="min-h-11 px-2 font-semibold text-green-700">Exit comparison</button>
                    </div>
                </AnimatedCollapse>
            </div>
        </header>
    );
}
