import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { PortalShell, Button, NotebookBackButton } from '../components/NotebookPrimitives';
import ValidationReportView from '../components/ValidationReportView';

export default function TeacherValidationReport() {
  const { classId } = useParams();
  const { user, logout } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('TEACHER');
  const [includeStale, setIncludeStale] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teacherService.getValidationReport(classId, source, includeStale);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to generate class validation report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [classId, source, includeStale]);

  const handleExportCsv = async () => {
    setExportError('');
    setExporting(true);
    try {
      await teacherService.downloadValidationExport(classId, source, includeStale);
    } catch (err) {
      setExportError(err.message || 'Failed to export validation CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <PortalShell
      portalSubtitle="Teacher Validation Lab"
      user={user}
      onLogout={logout}
      badgeIcon={FlaskConical}
      badgeLabel="Validation Report"
      badgeColorClass="bg-highlighter-mint text-ink"
      title="Class Agreement Report"
      subtitle="Measuring statistical agreement between blind teacher judgments and automated topic classifications."
      headerRight={
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <NotebookBackButton
            to={`/teacher/classes/${classId}/validation`}
            label="Validation Hub"
          />
          <NotebookBackButton
            to={`/teacher/classes/${classId}`}
            label="Class Detail"
          />
        </div>
      }
    >
      {exportError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl border-2 border-redpen bg-redpen-soft dark:bg-red-950/40 text-redpen-dark dark:text-red-200 text-xs font-mono font-bold"
        >
          Export failed: {exportError}
        </div>
      )}
      <ValidationReportView
        report={report}
        loading={loading}
        error={error}
        source={source}
        onSourceChange={setSource}
        includeStale={includeStale}
        onIncludeStaleChange={setIncludeStale}
        onExport={handleExportCsv}
        exporting={exporting}
        title="Class Validation Agreement Report"
        subtitle="Comparing blind teacher labels against automated gap analysis within this class."
      />
    </PortalShell>
  );
}

