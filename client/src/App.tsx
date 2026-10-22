import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { Dashboard } from './pages/Dashboard.js';
import { Documents } from './pages/Documents.js';
import { Requirements } from './pages/Requirements.js';
import { ConflictAnalysis } from './pages/ConflictAnalysis.js';
import { ConflictReports } from './pages/ConflictReports.js';
import { Settings } from './pages/Settings.js';
import { Login } from './pages/Login.js';
import { UploadModal } from './components/UploadModal.js';
import { ConflictComparisonModal } from './components/ConflictComparisonModal.js';
import { RequirementDetailModal } from './components/RequirementDetailModal.js';
import { api } from './services/api.js';
import { 
  DocumentRecord, 
  RequirementRecord, 
  ConflictRecord, 
  DashboardStats, 
  AnalysisJobRecord 
} from './types/index.js';
import { Loader2 } from 'lucide-react';

const MainApplication: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementRecord | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<AnalysisJobRecord | null>(null);
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('all');

  // Load all app data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [docsRes, reqsRes, confsRes, statsRes] = await Promise.all([
        api.documents.getAll(),
        api.requirements.getAll(),
        api.analysis.getConflicts(),
        api.analysis.getStats()
      ]);

      setDocuments(docsRes.documents);
      setRequirements(reqsRes.requirements);
      setConflicts(confsRes.conflicts);
      setStats(statsRes.stats);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Seed sample demo data
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.documents.seedDemo();
      await loadData();
      // Automatically trigger analysis on seeded data
      await handleRunAnalysis({});
    } catch (err: any) {
      alert(`Demo seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Run semantic analysis
  const handleRunAnalysis = async (options: { documentIds?: string[]; provider?: any }) => {
    setIsAnalyzing(true);
    try {
      const geminiKey = localStorage.getItem('gemini_api_key') || undefined;
      const openaiKey = localStorage.getItem('openai_api_key') || undefined;

      const res = await api.analysis.run({
        ...options,
        geminiApiKey: geminiKey,
        openaiApiKey: openaiKey
      });

      if (res.jobId) {
        // Poll job status until complete
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.analysis.getStatus(res.jobId);
            setActiveJob(statusRes.job);

            if (statusRes.job.status === 'completed' || statusRes.job.status === 'failed') {
              clearInterval(pollInterval);
              setIsAnalyzing(false);
              await loadData();
            }
          } catch (e) {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            await loadData();
          }
        }, 800);
      } else {
        setIsAnalyzing(false);
        await loadData();
      }
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document and its extracted requirements?')) {
      try {
        await api.documents.delete(docId);
        await loadData();
      } catch (err: any) {
        alert(`Failed to delete document: ${err.message}`);
      }
    }
  };

  // Navigate to requirements filtered for specific document
  const handleViewRequirementsForDoc = (docId: string) => {
    setSelectedDocFilter(docId);
    setCurrentTab('requirements');
  };

  // Inspect requirement from conflict modal
  const handleSelectRequirementFromConflict = (reqId: string) => {
    const found = requirements.find(r => r.requirement_id === reqId);
    if (found) {
      setSelectedRequirement(found);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <Loader2 size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        conflictCount={stats?.total_conflicts || 0}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          currentTab={currentTab}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onRunAnalysis={() => handleRunAnalysis({})}
          onSeedDemo={handleSeedDemo}
          isAnalyzing={isAnalyzing}
          isSeeding={isSeeding}
        />

        {/* Tab Pages */}
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentConflicts={conflicts}
            onOpenConflict={setSelectedConflict}
            onNavigateTab={setCurrentTab}
            onSeedDemo={handleSeedDemo}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            isSeeding={isSeeding}
          />
        )}

        {currentTab === 'documents' && (
          <Documents
            documents={documents}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onDeleteDocument={handleDeleteDocument}
            onViewRequirementsForDoc={handleViewRequirementsForDoc}
            onSeedDemo={handleSeedDemo}
            isSeeding={isSeeding}
          />
        )}

        {currentTab === 'requirements' && (
          <Requirements
            requirements={requirements}
            documents={documents}
            onSelectRequirement={setSelectedRequirement}
            selectedDocFilter={selectedDocFilter}
            setSelectedDocFilter={setSelectedDocFilter}
          />
        )}

        {currentTab === 'analysis' && (
          <ConflictAnalysis
            conflicts={conflicts}
            documents={documents}
            onOpenConflict={setSelectedConflict}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            activeJob={activeJob}
          />
        )}

        {currentTab === 'reports' && (
          <ConflictReports
            conflicts={conflicts}
            stats={stats}
            documents={documents}
            onOpenConflict={setSelectedConflict}
          />
        )}

        {currentTab === 'settings' && (
          <Settings
            onSeedDemo={handleSeedDemo}
            isSeeding={isSeeding}
          />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          loadData();
          setCurrentTab('documents');
        }}
      />

      {/* Side-by-Side Conflict Comparison Modal */}
      <ConflictComparisonModal
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
        onSelectRequirement={handleSelectRequirementFromConflict}
      />

      {/* Requirement Details & Traceability Modal */}
      <RequirementDetailModal
        requirement={selectedRequirement}
        onClose={() => setSelectedRequirement(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
