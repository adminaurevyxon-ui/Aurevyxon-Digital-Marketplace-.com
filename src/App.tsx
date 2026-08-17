/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Listing from "./pages/Listing";
import Sell from "./pages/Sell";

import UserDashboard from "./pages/dashboard/UserDashboard";
import SellerDashboard from "./pages/dashboard/SellerDashboard";
import Admin from "./pages/Admin";
import ManageListing from "./pages/ManageListing";
import DigitalProducts from "./pages/DigitalProducts";
import ExclusiveAssets from "./pages/ExclusiveAssets";
import AIModels from "./pages/AIModels";
import StartSelling from "./pages/StartSelling";
import DeveloperAPI from "./pages/DeveloperAPI";
import SellerGuide from "./pages/SellerGuide";
import AboutUs from "./pages/AboutUs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import DocumentUploadPage from "./pages/DocumentUploadPage";


import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary><Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="listing/:id" element={<Listing />} />
        <Route path="manage/:id" element={<ManageListing />} />
        <Route path="sell" element={<Sell />} />
        <Route path="dashboard" element={<Navigate to="/user/dashboard" replace />} />
        <Route path="user/dashboard" element={<UserDashboard />} />
        <Route path="seller/dashboard" element={<SellerDashboard />} />
        <Route path="admin" element={<Admin />} />
        <Route path="digital-products" element={<DigitalProducts />} />
        <Route path="exclusive-assets" element={<ExclusiveAssets />} />
        <Route path="ai-models" element={<AIModels />} />
        <Route path="start-selling" element={<StartSelling />} />
        <Route path="developer-api" element={<DeveloperAPI />} />
        <Route path="seller-guide" element={<SellerGuide />} />
        <Route path="about" element={<AboutUs />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
        <Route path="document-upload" element={<DocumentUploadPage />} />
        <Route path="kyc-upload" element={<DocumentUploadPage />} />

      </Route>
    </Routes></ErrorBoundary>
  );
}
