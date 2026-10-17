import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ServiceWarmup from "./components/common/ServiceWarmup";

function App() {
  return (
    <ToastProvider>
      <ServiceWarmup>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ServiceWarmup>
    </ToastProvider>
  );
}

export default App;