import { useMemo, useState } from "react";

const DENSITY_LEVELS = ['Low', 'Medium', 'High', 'Very High', 'None', 'No data'];
const today = new Date();
const CURRENT_CALENDAR_PERIOD = {
    year: today.getFullYear(),
    quarter: Math.floor(today.getMonth() / 3) + 1,
};

/** Owns the selected quarterly census period and map display state. */
const useMapFilters = (metadata) => {
    const periods = useMemo(() => metadata?.periods || [], [metadata?.periods]);
    const currentObservedPeriod = periods.find(period =>
        period.year === CURRENT_CALENDAR_PERIOD.year
        && period.quarter === CURRENT_CALENDAR_PERIOD.quarter
    );
    const defaultPeriod = currentObservedPeriod || metadata?.default_period || periods[0] || {};
    const [selectedYearState, setSelectedYearState] = useState(null);
    const [selectedQuarterState, setSelectedQuarterState] = useState(null);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [baselineYear, setBaselineYear] = useState('');
    const [activeFilters, setActiveFilters] = useState(DENSITY_LEVELS);
    const [selectedBarangay, setSelectedBarangay] = useState(null);
    const [activeMapLayer, setActiveMapLayer] = useState('density');

    const years = useMemo(
        () => [...new Set(periods.map(period => String(period.year)))],
        [periods],
    );
    const selectedYear = selectedYearState && years.includes(selectedYearState)
        ? selectedYearState
        : String(defaultPeriod.year || years[0] || '');
    const availableQuarters = useMemo(
        () => periods.filter(period => String(period.year) === selectedYear).map(period => period.quarter),
        [periods, selectedYear],
    );
    const selectedQuarter = availableQuarters.includes(Number(selectedQuarterState))
        ? Number(selectedQuarterState)
        : Number(defaultPeriod.year) === Number(selectedYear) && availableQuarters.includes(Number(defaultPeriod.quarter))
            ? Number(defaultPeriod.quarter)
            : availableQuarters[0] || null;

    const effectiveBaselineYear = useMemo(() => {
        const currentIndex = years.indexOf(selectedYear);
        const fallback = years[currentIndex + 1] || years.find(year => year !== selectedYear) || selectedYear;
        return baselineYear && years.includes(baselineYear) && baselineYear !== selectedYear
            ? baselineYear
            : fallback;
    }, [baselineYear, selectedYear, years]);

    const toggleFilter = (level) => setActiveFilters(previous =>
        previous.includes(level) ? previous.filter(item => item !== level) : [...previous, level]
    );
    const setSelectedYear = (year) => {
        setSelectedYearState(String(year));
        setSelectedBarangay(null);
    };
    const setSelectedQuarter = (quarter) => {
        setSelectedQuarterState(Number(quarter));
        setSelectedBarangay(null);
    };
    const setCompareMode = (enabled) => {
        setIsCompareMode(enabled);
        setActiveMapLayer(enabled ? 'growth' : 'density');
    };
    const clearFilters = () => {
        setSelectedYearState(null);
        setSelectedQuarterState(null);
        setSelectedBarangay(null);
        setIsCompareMode(false);
        setActiveMapLayer('density');
        setActiveFilters(DENSITY_LEVELS);
    };

    return {
        selectedYear, selectedQuarter, availableQuarters, periods,
        isCompareMode, baselineYear: effectiveBaselineYear, years,
        activeFilters, selectedBarangay, activeMapLayer,
        setActiveMapLayer, setSelectedYear, setSelectedQuarter, setBaselineYear,
        setIsCompareMode: setCompareMode, setSelectedBarangay, toggleFilter, clearFilters,
        hasActiveFilters: selectedBarangay !== null || isCompareMode || activeFilters.length < DENSITY_LEVELS.length || activeMapLayer !== 'density',
    };
};

export default useMapFilters;
