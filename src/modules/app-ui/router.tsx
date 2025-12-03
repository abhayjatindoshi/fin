import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DevDataSyncPage from '../dev/pages/data-sync/DevDataSyncPage';
import DevPage from '../dev/pages/DevPage';
import DevImportPage from '../dev/pages/import/DevImportPage';
import DevStorePage from '../dev/pages/store/DevStorePage';
import { AppLoader } from './AppLoader';
import BaseLayout from './components/layouts/BaseLayout';
import AboutPage from './pages/AboutPage';
import BudgetPage from './pages/BudgetPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import { RedirectTo } from './pages/RedirectTo';
import SettingsPage from './pages/SettingsPage';
import TransactionsPage from './pages/TransactionsPage';

export default function AppRouter() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/" element={<AppLoader />}>
                    <Route path="/:householdId" element={<BaseLayout />}>
                        <Route index element={<RedirectTo to="home" />} />
                        <Route path="home" element={<HomePage />} />
                        <Route path="transactions" element={<TransactionsPage />} />
                        <Route path="budget" element={<BudgetPage />} />
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
