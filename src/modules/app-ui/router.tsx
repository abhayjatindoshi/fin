import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StoreTesting from './pages/StoreTesting';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/store-testing" element={<StoreTesting />} />
            </Routes>
        </BrowserRouter>
    );
}
