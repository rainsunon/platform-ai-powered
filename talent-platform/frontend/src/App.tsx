import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { setApiActorRole } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewAndLedgerPage } from './pages/OverviewAndLedgerPage';
import { InvoicesAndBillingPage } from './pages/InvoicesAndBillingPage';
import { ClientPortalAndPlansPage } from './pages/ClientPortalAndPlansPage';
import { AccessMatrixPage } from './pages/AccessMatrixPage';
import { TaxAndCompliancePage } from './pages/TaxAndCompliancePage';
import { ManualEntryModal } from './components/modals/ManualEntryModal';
import { SearchModal } from './components/modals/SearchModal';
import { EditUserRoleDrawer } from './components/drawers/EditUserRoleDrawer';
import { BudgetMonitoringModal } from './components/modals/BudgetMonitoringModal';
import { ToastContainer } from './components/ui/toast';
import { Toaster } from './components/shadcn/sonner';
import { TooltipProvider } from './components/shadcn/tooltip';

export default function App() {
  const { isMobileNavOpen, setIsMobileNavOpen } = useAppStore();

  useEffect(() => {
    const { simulatedRole, hydrate } = useAppStore.getState();
    setApiActorRole(simulatedRole);
    void hydrate();
  }, []);

  return (
    <TooltipProvider>
      <Router>
      <div className="min-h-screen bg-surface font-body text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed flex flex-col">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl">
              <Sidebar isMobile onCloseMobile={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-16 bg-surface min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<OverviewAndLedgerPage />} />
              <Route path="/overview-and-ledger" element={<OverviewAndLedgerPage />} />
              <Route path="/invoices-and-billing" element={<InvoicesAndBillingPage />} />
              <Route path="/client-portal-and-plans" element={<ClientPortalAndPlansPage />} />
              <Route path="/cash-flow-and-forecasting" element={<ClientPortalAndPlansPage />} />
              <Route path="/access-and-permissions-matrix" element={<AccessMatrixPage />} />
              <Route path="/tax-and-compliance" element={<TaxAndCompliancePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Modals & Slide-over Drawers */}
        <ManualEntryModal />
        <SearchModal />
        <EditUserRoleDrawer />
        <BudgetMonitoringModal />
        <ToastContainer />
        <Toaster />
      </div>
      </Router>
    </TooltipProvider>
  );
}
