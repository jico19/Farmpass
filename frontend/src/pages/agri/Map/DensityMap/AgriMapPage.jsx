import { useState, useRef, useEffect } from "react";
import MainMap from "./MainMap";
import { useGetHogSurvey, useGetMaps, useGetHogSurveyPeriods, useGetTransportVolume } from '../../../../hooks/useMaps';
import { Loader2, X, PanelRightOpen } from "lucide-react";
import HogSurveyUploadModal from '../../../../components/HogSurveyUploadModal';
import useMapFilters from './useMapFilters';
import useMapInsights from './useMapInsights';
import MapToolbar from './MapToolbar';
import CensusStatusPanel from './CensusStatusPanel';

/** Map-first census workspace with a responsive details inspector. */
const AgriMapPage = () => {
    const mapRef = useRef(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [wideScreen, setWideScreen] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
    const detailsRef = useRef(null);
    useEffect(() => {
        const media = window.matchMedia('(min-width: 1280px)');
        const update = () => setWideScreen(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (!wideScreen && detailsOpen) detailsRef.current?.showModal();
        else detailsRef.current?.close();
    }, [wideScreen, detailsOpen]);

    const { data: map, isError: mapError } = useGetMaps();
    const { data: periodMetadata } = useGetHogSurveyPeriods();
    const filters = useMapFilters(periodMetadata);
    const selectBarangay = (name) => {
        filters.setSelectedBarangay(name);
        if (name && !wideScreen) setDetailsOpen(true);
    };
    const displayFilters = { ...filters, setSelectedBarangay: selectBarangay };
    const {
        data: transportVolume = [],
        isFetching: transportLoading,
        isError: transportError,
    } = useGetTransportVolume(filters.selectedYear, filters.selectedQuarter);

    // Primary survey query (Target Year)
    const {
        data: survey,
        isFetching: surveyFetching,
        isPending: surveyLoading,
        isPlaceholderData: surveyPlaceholder,
        isError: surveyError,
    } = useGetHogSurvey(filters.selectedYear, filters.selectedQuarter);

    // Baseline survey query (Active when Compare Mode is enabled)
    const {
        data: compareSurvey,
        isFetching: compareSurveyFetching,
        isPending: comparisonLoading,
        isPlaceholderData: comparisonPlaceholder,
        isError: comparisonError,
    } = useGetHogSurvey(filters.isCompareMode ? filters.baselineYear : null, filters.isCompareMode ? filters.selectedQuarter : null);

    const { 
        comparisonStats, 
        operationalTakeaway, 
        secondaryTakeaway,
        topHotspots,
        totalPigs, 
        isMapDataUpdating 
    } = useMapInsights({
        map,
        survey,
        compareSurvey,
        surveyFetching,
        compareSurveyFetching,
        filters
    });

    const details = (
        <CensusStatusPanel
            filters={displayFilters}
            totalPigs={totalPigs}
            isMapDataUpdating={isMapDataUpdating}
            surveyLoading={surveyLoading}
            surveyPlaceholder={surveyPlaceholder}
            surveyError={surveyError}
            comparisonLoading={comparisonLoading}
            comparisonPlaceholder={comparisonPlaceholder}
            comparisonError={comparisonError}
            transportLoading={transportLoading}
            transportError={transportError}
            operationalTakeaway={operationalTakeaway}
            secondaryTakeaway={secondaryTakeaway}
            comparisonStats={comparisonStats}
            survey={survey || []}
            compareSurvey={compareSurvey || []}
            topHotspots={topHotspots}
            transportVolume={transportVolume || []}
        />
    );
    const unavailableMessage = mapError ? 'Barangay boundaries could not be loaded. Refresh to try again.'
        : filters.activeMapLayer === 'transport'
            ? transportLoading ? 'Updating permit outflows…' : transportError ? 'Permit outflows could not be loaded. Refresh to try again.' : !transportVolume.length ? 'No transport figures available for this period.' : null
            : surveyError ? 'Census could not be loaded. Refresh to try again.'
                : isMapDataUpdating || surveyLoading || surveyPlaceholder ? 'Updating census…'
                    : filters.activeMapLayer === 'growth' && (comparisonLoading || comparisonPlaceholder || comparisonError)
                        ? comparisonError ? 'Comparison could not be loaded. Refresh to try again.' : 'Updating comparison…' : null;

    return (
        <div className="flex-1 min-w-0 p-3 md:p-5 lg:p-6 space-y-4 bg-stone-100 min-h-full font-sans">
            
            {/* Page actions and period filters */}
            <MapToolbar 
                map={map} 
                filters={displayFilters}
                onOpenUpload={() => setIsUploadModalOpen(true)}
            />

            {/* Map-first workspace */}
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">

                <div className="flex min-w-0 flex-col bg-white rounded-xl border border-stone-200 relative h-[max(420px,65dvh)] xl:h-[max(480px,calc(100dvh-260px))] overflow-hidden shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 p-2">
                        <div className="flex flex-wrap gap-1" role="group" aria-label="Map layer">
                            {[
                                ['density', 'Population'],
                                ['transport', 'Permit outflows'],
                                ...(filters.isCompareMode ? [['growth', 'Population change']] : []),
                            ].map(([layer, label]) => (
                                <button key={layer} type="button" aria-pressed={filters.activeMapLayer === layer} onClick={() => filters.setActiveMapLayer(layer)}
                                    className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-green-700 ${filters.activeMapLayer === layer ? 'bg-green-50 text-green-700' : 'text-stone-600 hover:bg-stone-100'}`}>{label}</button>
                            ))}
                        </div>
                        {!wideScreen && <button type="button" onClick={() => setDetailsOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-green-700"><PanelRightOpen size={16} /> View details</button>}
                    
                    {/* Non-Intrusive Syncing Indicator */}
                    {isMapDataUpdating && (
                        <div role="status" className="px-2 flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin motion-reduce:animate-none text-green-700" />
                            <span className="text-xs font-bold text-stone-800">
                                Updating…
                            </span>
                        </div>
                    )}
                    </div>

                    {/* Interactive Map */}
                    <MainMap
                        ref={mapRef}
                        mapData={map}
                        surveyData={survey}
                        activeFilters={filters.activeFilters}
                        toggleFilter={filters.toggleFilter}
                        selectedBarangay={filters.selectedBarangay}
                        setSelectedBarangay={selectBarangay}
                        isCompareMode={filters.isCompareMode}
                        compareSurveyData={compareSurvey || []}
                        activeMapLayer={filters.activeMapLayer}
                        transportVolumeData={transportVolume}
                        unavailableMessage={unavailableMessage}
                    />
                </div>
                {wideScreen ? <aside aria-label="Census details" className="min-w-0 overflow-y-auto rounded-xl border border-stone-200 bg-white xl:h-[max(480px,calc(100dvh-260px))]">{details}</aside> : (
                    <dialog ref={detailsRef} onClose={() => setDetailsOpen(false)}
                        aria-label={filters.selectedBarangay ? `${filters.selectedBarangay} details` : 'Sariaya overview'}
                        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-auto rounded-t-xl border border-stone-200 bg-white p-0 text-stone-800 backdrop:bg-stone-900/40 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[380px] md:rounded-none">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2">
                            <span className="text-sm font-semibold">Map details</span>
                            <button type="button" autoFocus onClick={() => setDetailsOpen(false)} aria-label="Close details" className="flex size-11 items-center justify-center rounded-lg hover:bg-stone-100"><X size={20} /></button>
                        </div>
                        {details}
                    </dialog>
                )}
            </div>
            
            {/* Survey CSV Upload Modal */}
            <HogSurveyUploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
            />
        </div>
    );
};

export default AgriMapPage;
