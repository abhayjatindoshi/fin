import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLoader } from './AppLoader';
import BaseLayout from './components/layouts/BaseLayout';
import Dashboard from './pages/Dashboard';
import { RedirectTo } from './pages/RedirectTo';
import SubTestPage from './pages/SubTestPage';
import TestPage from './pages/TestPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AppLoader />}>
                    <Route path="/:householdId" element={<BaseLayout />}>
                        <Route index element={<RedirectTo to="dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="test" element={<TestPage />} />
                        <Route path="test/:tagId" element={<SubTestPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
