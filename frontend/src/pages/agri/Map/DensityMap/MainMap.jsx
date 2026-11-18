import { forwardRef, useEffect, useId, useState } from 'react';
import { Map, MapControls, useMap } from '../../../../components/ui/map';
import MapDataHandler from './MapDataHandler';
import { RotateCcw, ChevronUp, Layers } from 'lucide-react';
import './map-workspace.css';

const CENTER = [121.5239, 13.9630];
const LEGENDS = {
    density: [
        ['Very High', '1,500+', '#dc2626'], ['High', '500–1,499', '#f97316'],
        ['Medium', '100–499', '#eab308'], ['Low', '1–99', '#22c55e'],
        ['None', 'Recorded zero', '#94a3b8'], ['No data', 'No observations', '#e2e8f0'],
    ],
    transport: [
        ['Very high', '300+ pigs', '#075985'], ['High', '100–299 pigs', '#3b82f6'],
        ['Moderate', '20–99 pigs', '#06b6d4'], ['Low', '1–19 pigs', '#10b981'], ['Zero', '0 pigs', '#cbd5e1'],
    ],
    growth: [
        ['Increase', '>50 pigs', '#059669'], ['Increase', '1–50 pigs', '#34d399'],
        ['Unchanged', '0 pigs', '#94a3b8'], ['Decrease', '1–50 pigs', '#fb7185'],
        ['Decrease', '>50 pigs', '#e11d48'], ['Unavailable', 'No comparison', '#e2e8f0'],
    ],
};

function ResizeMap() {
    const { map } = useMap();
    useEffect(() => {
        if (!map) return;
        const observer = new ResizeObserver(() => map.resize());
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);
    return null;
}

const MainMap = forwardRef(function MainMap({
    activeMapLayer = 'density', activeFilters, toggleFilter, setSelectedBarangay,
    unavailableMessage, ...props
}, ref) {
    const [legendOpen, setLegendOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
    const [instantLegend, setInstantLegend] = useState(false);
    const legendId = useId();
    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <Map ref={ref} center={CENTER} zoom={12} theme="light" style="https://tiles.openfreemap.org/styles/bright">
                    <ResizeMap />
                    <MapControls position="top-right" />
                    <MapDataHandler {...props} unavailable={Boolean(unavailableMessage)} activeMapLayer={activeMapLayer} activeFilters={activeFilters} setSelectedBarangay={setSelectedBarangay} />
                </Map>
                {unavailableMessage && <div role="status" className="absolute inset-x-3 top-16 rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-700 shadow-sm">{unavailableMessage}</div>}
                <div className="absolute right-3 bottom-9 z-10 w-[230px] max-w-[calc(100%-80px)]" data-instant={instantLegend}>
                    <div id={legendId} inert={!legendOpen} aria-hidden={!legendOpen}
                        data-open={legendOpen} className="map-legend-panel absolute right-0 bottom-full mb-2 w-full rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
                        <p className="border-b border-stone-100 px-2 py-2 text-xs font-medium text-stone-600">
                            {activeMapLayer === 'density' ? 'Recorded pigs · select levels' : activeMapLayer === 'transport' ? 'Pigs transported this period' : 'Change in recorded pigs'}
                        </p>
                        <div className="max-h-[min(300px,35dvh)] space-y-1 overflow-y-auto pt-1">
                        {LEGENDS[activeMapLayer].map(([name, range, color], index) => {
                            const contents = <><span className="size-3 shrink-0 rounded-sm border border-stone-300" style={{ backgroundColor: color }} /><span className="flex-1">{name === 'None' ? 'Zero' : name}</span><span className="text-xs tabular-nums text-stone-600">{range}</span></>;
                            return activeMapLayer === 'density'
                                ? <button type="button" key={name} aria-pressed={activeFilters.includes(name)} onClick={() => toggleFilter(name)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-2 text-left text-xs transition-[color,background-color,border-color] duration-150 ease-[var(--ease-smooth)] motion-reduce:transition-none motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-green-700 ${activeFilters.includes(name) ? 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-green-50' : 'border-transparent text-stone-500 line-through hover:bg-stone-50'}`}>{contents}</button>
                                : <div key={index} className="flex min-h-11 items-center gap-2 px-2 text-xs">{contents}</div>;
                        })}
                        </div>
                    </div>
                    <button type="button" aria-controls={legendId} aria-expanded={legendOpen} onClick={event => {
                        setInstantLegend(event.detail === 0);
                        setLegendOpen(open => !open);
                    }} className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-left text-xs font-semibold text-stone-700 shadow-sm transition-[background-color,border-color] duration-150 ease-[var(--ease-smooth)] hover:bg-stone-50 motion-reduce:transition-none motion-safe:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-green-700">
                        <Layers size={16} className="shrink-0 text-green-700" />
                        <span className="flex-1">{activeMapLayer === 'density' ? 'Population level' : activeMapLayer === 'transport' ? 'Permit outflows' : 'Population change'}</span>
                        <ChevronUp size={16} className="map-legend-chevron shrink-0" data-open={legendOpen} />
                    </button>
                </div>
                <button type="button" onClick={() => {
                    ref.current?.jumpTo({ center: CENTER, zoom: 12 });
                    setSelectedBarangay(null);
                }} aria-label="Reset Bounds" className="absolute bottom-9 left-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-100"><RotateCcw size={16} /><span className="sr-only sm:not-sr-only">Reset Bounds</span></button>
            </div>
        </div>
    );
});

export default MainMap;
