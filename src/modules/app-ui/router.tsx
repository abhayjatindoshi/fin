import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DevStorePage from '../dev/pages/DevStorePage';
import { AppLoader } from './AppLoader';
import BaseLayout from './components/layouts/BaseLayout';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
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
                        <Route path="dev">
                            <Route index element={<RedirectTo to="store" />} />
                            <Route path="store" element={<DevStorePage />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
