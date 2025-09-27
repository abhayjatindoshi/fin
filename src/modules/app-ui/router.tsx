import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DriveTest from './pages/DriveTest';
import PersistenceTesting from './pages/PersistenceTesting';
import StoreTesting from './pages/StoreTesting';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/persistence-testing" element={<PersistenceTesting />} />
                <Route path="/store-testing" element={<StoreTesting />} />
                <Route path="/drive-test" element={<DriveTest />} />
            </Routes>
        </BrowserRouter>
    );
}
