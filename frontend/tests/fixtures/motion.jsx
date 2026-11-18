import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MotionProvider from '../../src/components/motion/MotionProvider';
import AnimatedDialog from '../../src/components/motion/AnimatedDialog';
import AnimatedCollapse from '../../src/components/motion/AnimatedCollapse';
import ConfirmationModal from '../../src/components/ui/ConfirmationModal';
import FileViewerModal from '../../src/components/ui/FileViewerModal';
import SignatoryModal from '../../src/pages/shared/SignatoryModal';
import AgriMapPage from '../../src/pages/agri/Map/DensityMap/AgriMapPage';
import FAQsAccordion from '../../src/pages/landing-page/FAQs/sections/FAQsAccordion';
import LandingNavbar from '../../src/components/ui/LandingNavbar';
import Sidebar from '../../src/components/ui/Sidebar';
import '../../src/index.css';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
const periods = [{ year: 2026, quarter: 4 }, { year: 2025, quarter: 4 }];
client.setQueryData(['hog-survey-periods'], { periods, default_period: periods[0] });
client.setQueryData(['map'], [{ id: 1, name: 'Test barangay', geojson: [[121.50, 13.94], [121.53, 13.94], [121.53, 13.97], [121.50, 13.97], [121.50, 13.94]], latitude: 13.955, longitude: 121.515 }]);
client.setQueryData(['notification', 'section_counts'], {});
for (const year of ['2026', '2025']) {
    client.setQueryData(['hog-survey', year, 4], [{
        barangay: 'Test barangay', has_observations: true, total_pigs: year === '2026' ? 600 : 450,
        raiser_count: 12, density_level: 'High', quarter: 4, year, census_date: `${year}-11-01`,
        coverage: { observed_barangays: 1, total_barangays: 1 },
        breakdown: { inahin: 100, fattener: 300, grower: 200 },
    }]);
    client.setQueryData(['transport-volume', year, 4], [{ barangay: 'Test barangay', total_transported: 100, volume_level: 'Heavy' }]);
}

export default function Fixture() {
    const [open, setOpen] = useState(false);
    const [nested, setNested] = useState(false);
    const [busy, setBusy] = useState(false);
    const [native, setNative] = useState(false);
    const [confirmation, setConfirmation] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [submits, setSubmits] = useState(0);
    if (new URLSearchParams(location.search).get('view') === 'sidebar') return <Sidebar><h2>Workspace</h2></Sidebar>;
    if (new URLSearchParams(location.search).get('view') === 'map') return <AgriMapPage />;
    return <main className="space-y-4 p-6">
        <button id="open-dialog" type="button" onClick={() => setOpen(true)}>Open dialog</button>
        <button type="button" onClick={() => setConfirmation(true)}>Open confirmation</button>
        <button type="button" onClick={() => setNative(true)}>Open native dialog</button>
        <button type="button" onClick={() => setExpanded(value => !value)}>Toggle collapse</button>
        <AnimatedCollapse open={expanded} id="test-collapse"><input aria-label="Retained input" defaultValue="Preserved" /></AnimatedCollapse>
        <output aria-label="Submissions">{submits}</output>
        <AnimatedDialog open={open} portal onDismiss={() => { if (!busy) setOpen(false); }}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
                <form className="w-full max-w-md space-y-4 rounded-xl bg-white p-6" onSubmit={event => { event.preventDefault(); setSubmits(count => count + 1); setOpen(false); }}>
                    <h2>Test form</h2>
                    <input aria-label="Name" autoFocus defaultValue="Farmer" />
                    <button type="button" onClick={() => setNested(true)}>Open nested viewer</button>
                    <label><input type="checkbox" checked={busy} onChange={event => setBusy(event.target.checked)} /> Busy</label>
                    <button type="submit">Send form</button>
                    <button id="close-dialog" type="button" onClick={() => setOpen(false)}>Close form</button>
                </form>
            </div>
        </AnimatedDialog>
        <FileViewerModal isOpen={nested} onClose={() => setNested(false)} title="Nested viewer"
            fileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='green'/%3E%3C/svg%3E" />
        <AnimatedDialog open={native}>
            <SignatoryModal title="Native test" onClose={() => setNative(false)}><p className="p-4">Native content</p></SignatoryModal>
        </AnimatedDialog>
        <ConfirmationModal isOpen={confirmation} onClose={() => setConfirmation(false)} onYes={() => { setSubmits(count => count + 1); setConfirmation(false); }} title="Confirm test" message="Keep the form contract." />
        <div className="landing-motion"><FAQsAccordion /><LandingNavbar /></div>
    </main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><QueryClientProvider client={client}>
    <MotionProvider><MemoryRouter><Fixture /></MemoryRouter></MotionProvider>
</QueryClientProvider></StrictMode>);
