import { Routes, Route } from "react-router-dom"
import { DashboardPage } from "../layouts/DashboardPage.jsx"

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />}> 
            
            </Route>
        </Routes>
    )
}