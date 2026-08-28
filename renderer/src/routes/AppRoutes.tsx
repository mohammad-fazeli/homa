import { lazy, Suspense, Component, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Users = lazy(() => import("../pages/Users"));
const CreateUser = lazy(() => import("../pages/CreateUser"));
const EditUser = lazy(() => import("../pages/EditUser"));
const Sessions = lazy(() => import("../pages/Sessions"));
const Billing = lazy(() => import("../pages/Billing"));
const Settings = lazy(() => import("../pages/Settings"));
const Reminders = lazy(() => import("../pages/Reminders"));
const Academy = lazy(() => import("../pages/Academy"));
const Kiosk = lazy(() => import("../pages/Kiosk"));

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
          <p className="font-semibold text-ink">این صفحه با خطا روبه‌رو شد</p>
          <p className="text-sm text-muted max-w-md">{this.state.error.message}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            بارگذاری دوباره
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center text-muted">
            در حال آماده‌سازی صفحه...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<CreateUser />} />
          <Route path="/user/new" element={<Navigate to="/users/new" replace />} />
          <Route path="/users/edit/:id" element={<EditUser />} />
          <Route path="/users/edit" element={<Navigate to="/users" replace />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
