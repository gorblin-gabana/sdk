import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import GettingStarted from "./pages/GettingStarted";
import APIReference from "./pages/APIReference";
import Examples from "./pages/Examples";
import RpcOperations from "./pages/RpcOperations";
import TransactionDecoding from "./pages/TransactionDecoding";
import ErrorHandling from "./pages/ErrorHandling";
import InteractivePlayground from "./pages/InteractivePlayground";
import CryptoPlayground from "./pages/CryptoPlayground";
import { SearchProvider } from "./components/SearchContext";

export default function App() {
  return (
    <SearchProvider>
      <div className="min-h-screen bg-docs-bg flex">
        {/* Static Sidebar - always visible, full height */}
        <Sidebar />

        {/* Main content - properly aligned next to sidebar */}
        <div className="flex-1 flex flex-col ml-80">
          {/* Page content - no header, direct content */}
          <main className="flex-1 py-8">
            <div className="mx-auto max-w-6xl px-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/getting-started" element={<GettingStarted />} />
                <Route path="/api-reference" element={<APIReference />} />
                <Route path="/examples" element={<Examples />} />
                <Route path="/rpc-operations" element={<RpcOperations />} />
                <Route
                  path="/transaction-decoding"
                  element={<TransactionDecoding />}
                />
                <Route path="/error-handling" element={<ErrorHandling />} />
                <Route path="/playground" element={<InteractivePlayground />} />
                <Route
                  path="/crypto-playground"
                  element={<CryptoPlayground />}
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
