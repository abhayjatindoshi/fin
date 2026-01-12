import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppLogger } from '../app/logging/AppLogger';
import DevDataSyncPage from '../dev/pages/data-sync/DevDataSyncPage';
import DevPage from '../dev/pages/DevPage';
import DevImportPage from '../dev/pages/import/DevImportPage';
import DevStorePage from '../dev/pages/store/DevStorePage';
import { AppLoader } from './AppLoader';
import AuthBaseLayout from './components/layouts/AuthBaseLayout';
import BaseLayout from './components/layouts/BaseLayout';
import AboutPage from './pages/AboutPage';
import AuthHandlerPage from './pages/AuthHandlerPage';
import HomePage from './pages/HomePage';
import HouseholdPage from './pages/HouseholdPage';
import ImportPage from './pages/ImportPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import { RedirectTo } from './pages/RedirectTo';
import SettingsPage from './pages/SettingsPage';
import SpendsPage from './pages/SpendsPage';
import TransactionsPage from './pages/TransactionsPage';

export default function AppRouter() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Logger />
            <Routes>
                <Route path="auth" element={<AuthBaseLayout />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="callback" element={<AuthHandlerPage />} />
                    <Route path="households" element={<HouseholdPage />} />
                </Route>
                <Route path="" element={<AppLoader />}>
                    <Route path=":householdId" element={<BaseLayout />}>
                        <Route path="auth/callback" element={<AuthHandlerPage />} />
                        <Route index element={<RedirectTo to="home" />} />
                        <Route path="home" element={<HomePage />} />
                        <Route path="transactions" element={<TransactionsPage />} />
                        <Route path="spends" element={<SpendsPage />} />
                        <Route path="import" element={<ImportPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="dev">
                            <Route index element={<DevPage />} />
                            <Route path="data-sync" element={<DevDataSyncPage />} />
                            <Route path="import" element={<DevImportPage />} />
                            <Route path="store/:entityName?/:entityId?" element={<DevStorePage />} />
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

const Logger: React.FC = () => {
    const logger = AppLogger.tagged('AppRouter');
    const location = useLocation();

    useEffect(() => {
        logger.i('Route changed to', location.pathname);
    }, [location]);

    return null;
}
