import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DevPage from '../dev/pages/DevPage';
import DevStorePage from '../dev/pages/store/DevStorePage';
import { AppLoader } from './AppLoader';
import BaseLayout from './components/layouts/BaseLayout';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import { RedirectTo } from './pages/RedirectTo';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AppLoader />}>
                    <Route path="/:householdId" element={<BaseLayout />}>
                        <Route index element={<RedirectTo to="dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="dev">
                            <Route index element={<DevPage />} />
                            <Route path="store/:entityName?/:entityId?" element={<DevStorePage />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
