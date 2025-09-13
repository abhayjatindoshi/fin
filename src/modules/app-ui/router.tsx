import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PersistenceTesting from './pages/PersistenceTesting';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/persistence-testing" element={<PersistenceTesting />} />
            </Routes>
        </BrowserRouter>
    );
}
