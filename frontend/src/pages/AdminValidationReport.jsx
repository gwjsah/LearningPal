import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { PortalShell, Button } from '../components/NotebookPrimitives';
import ValidationReportView from '../components/ValidationReportView';

export default function AdminValidationReport() {
  const { user, logout } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('TEACHER');
  const [includeStale, setIncludeStale] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getValidationReport(source, includeStale);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate institution validation report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [source, includeStale]);

  return (
    <PortalShell
      portalSubtitle="Institution Administration"
      user={user}
      onLogout={logout}
      badgeIcon={ShieldCheck}
      badgeLabel="Admin Validation"
      badgeColorClass="bg-highlighter-yellow text-ink"
      title="Institution Validation Lab"
      subtitle="Aggregate validation agreement across all sections and teachers in your institution."
      headerRight={
        <Button
          to="/admin"
          variant="secondary"
          size="sm"
          className="text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Admin Home</span>
        </Button>
      }
    >
      <ValidationReportView
        report={report}
        loading={loading}
        error={error}
        source={source}
        onSourceChange={setSource}
        includeStale={includeStale}
        onIncludeStaleChange={setIncludeStale}
        title="Institution Validation Report"
        subtitle="Aggregate validation metrics spanning all classrooms in your institution."
      />
    </PortalShell>
  );
}

