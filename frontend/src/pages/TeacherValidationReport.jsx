import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { PortalShell, Button } from '../components/NotebookPrimitives';
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
    setExporting(true);
    try {
      await teacherService.downloadValidationExport(classId, source, includeStale);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
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
        <div className="flex items-center gap-2">
          <Button
            to={`/teacher/classes/${classId}/validation`}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            <span>Validation Hub</span>
          </Button>
          <Button
            to={`/teacher/classes/${classId}`}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Class Detail</span>
          </Button>
        </div>
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
        onExport={handleExportCsv}
        exporting={exporting}
        title="Class Validation Agreement Report"
        subtitle="Comparing blind teacher labels against automated gap analysis within this class."
      />
    </PortalShell>
  );
}

