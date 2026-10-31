import React, { useState, useEffect, useCallback } from 'react';
import HeaderNav from './components/HeaderNav';
import DemoScenarioSelector from './components/DemoScenarioSelector';
import LiveSensorCards from './components/LiveSensorCards';
import AssessmentRecommendationCard from './components/AssessmentRecommendationCard';
import TreatmentRecommendationGuide from './components/TreatmentRecommendationGuide';
import NonPotableReuseMatrix from './components/NonPotableReuseMatrix';
import HistoricalCharts from './components/HistoricalCharts';
import SystemEventsTable from './components/SystemEventsTable';
import ConfigModal from './components/ConfigModal';
import HardwareIntegrationModal from './components/HardwareIntegrationModal';
import AssessmentReportModal from './components/AssessmentReportModal';
import { dataProvider } from './services/dataProvider';

export default function App() {
  const [mode, setMode] = useState('SIMULATED'); // 'SIMULATED' or 'HARDWARE'
  const [activeScenarioId, setActiveScenarioId] = useState(1);
  const [latestReading, setLatestReading] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [rulesConfig, setRulesConfig] = useState(null);
  const [serialStatus, setSerialStatus] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(3000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Core Data Fetcher
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [reading, status, hist, evs, config, serial] = await Promise.all([
        dataProvider.fetchLatestReading('GW-001', mode, activeScenarioId),
        dataProvider.fetchDeviceStatus('GW-001', mode, activeScenarioId),
        dataProvider.fetchHistory('GW-001', mode, 50),
        dataProvider.fetchSystemEvents('GW-001', mode),
        dataProvider.getRulesConfig(),
        dataProvider.fetchSerialStatus()
      ]);

      setLatestReading(reading);
      setDeviceStatus(status);
      setHistory(hist);
      setEvents(evs);
      setRulesConfig(config);
      setSerialStatus(serial);
    } catch (err) {
      console.error('[App] Failed to refresh telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [mode, activeScenarioId]);

  // Immediate refresh on mode or scenario change
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Periodic polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, pollingInterval);
    return () => clearInterval(timer);
  }, [refreshData, pollingInterval]);

  const handleSelectScenario = (scenarioId) => {
    setActiveScenarioId(scenarioId);
  };

  const handleSaveConfig = async (newConfig) => {
    const updated = await dataProvider.updateRulesConfig(newConfig);
    setRulesConfig(updated);
    refreshData();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px 60px' }}>
      
      {/* 1. Header Navigation */}
      <HeaderNav
        mode={mode}
        setMode={setMode}
        deviceStatus={deviceStatus}
        serialStatus={serialStatus}
        latestReading={latestReading}
        pollingInterval={pollingInterval}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* 2. Demo Scenario Selector (10 Presets) */}
      <DemoScenarioSelector
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        isSimulated={mode === 'SIMULATED'}
      />

      {/* 3. Live Sensor Metric Gauges (Turbidity, TDS, Temp, Optional pH) */}
      <LiveSensorCards
        sensors={latestReading?.sensors}
        assessment={latestReading?.assessment}
        isStale={latestReading?.is_stale}
      />

      {/* 4. Water Quality Assessment & Recommendation Overview */}
      <AssessmentRecommendationCard
        assessment={latestReading?.assessment}
      />

      {/* 5. Recommended External Treatment Pathway Guide (Informational) */}
      <TreatmentRecommendationGuide
        assessment={latestReading?.assessment}
      />

      {/* 6. Approved Non-Potable Water Reuse Suitability Matrix */}
      <NonPotableReuseMatrix
        treatmentLevel={latestReading?.assessment?.treatment_level}
        assessmentStatus={latestReading?.assessment?.assessment_status}
      />

      {/* 7. Historical Telemetry Charts */}
      <HistoricalCharts
        history={history}
      />

      {/* 8. System Events & Anomaly Log */}
      <SystemEventsTable
        events={events}
      />

      {/* 9. Modals */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={rulesConfig}
        onSaveConfig={handleSaveConfig}
        pollingInterval={pollingInterval}
        setPollingInterval={setPollingInterval}
      />

      <HardwareIntegrationModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      <AssessmentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        latestReading={latestReading}
        history={history}
      />

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-subtle)',
        fontSize: '0.8rem',
        lineHeight: 1.6
      }}>
        <div>
          <strong>GreyWater Guardian</strong> — IoT Greywater Quality Assessment & Treatment Recommendation System
        </div>
        <div>
          Target Project Review: <strong>2 November 2026</strong> • Department of Environmental Science & IoT Engineering
        </div>
        <div>
          Built with React 19, Vite PWA, Express REST API & Deterministic Rules Engine • Sensor-Based Quality Analysis
        </div>
      </footer>

    </div>
  );
}
