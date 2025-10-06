import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLoader } from './AppLoader';
import StoreTesting from './pages/StoreTesting';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AppLoader />}>
                    <Route path="/:householdId">
                        <Route path="" element={<StoreTesting />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
