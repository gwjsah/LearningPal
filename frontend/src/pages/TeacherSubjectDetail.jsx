import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  FileQuestion,
  GraduationCap,
  Link2,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Archive,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  Eye,
  AlertTriangle,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import {
  Button,
  NotebookCard,
  PortalShell,
} from '../components/NotebookPrimitives';

export default function TeacherSubjectDetail() {
  const { subjectId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'questions' | 'quizzes' | 'resources'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 1. TOPICS STATE
  const [topics, setTopics] = useState([]);
  const [topicModal, setTopicModal] = useState(null); // { mode: 'create' } or { mode: 'edit', topic }
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicModalLoading, setTopicModalLoading] = useState(false);
  const [topicModalError, setTopicModalError] = useState('');

  // 2. QUESTION BANK STATE
  const [questions, setQuestions] = useState([]);
  const [questionFilterTopic, setQuestionFilterTopic] = useState('');
  const [questionFilterDifficulty, setQuestionFilterDifficulty] = useState('');
  const [questionFilterStatus, setQuestionFilterStatus] = useState('ACTIVE');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionModal, setQuestionModal] = useState(null); // { mode: 'create' } or { mode: 'edit', question }
  const [qTopicId, setQTopicId] = useState('');
  const [qText, setQText] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('MEDIUM');
  const [qPoints, setQPoints] = useState(1.0);
  const [qChoices, setQChoices] = useState([
    { label: 'A', text: '', isCorrect: true },
    { label: 'B', text: '', isCorrect: false },
    { label: 'C', text: '', isCorrect: false },
    { label: 'D', text: '', isCorrect: false },
  ]);
  const [qModalLoading, setQModalLoading] = useState(false);
  const [qModalError, setQModalError] = useState('');

  // 3. QUIZZES STATE
  const [quizzes, setQuizzes] = useState([]);
  const [quizModal, setQuizModal] = useState(null); // { mode: 'create' } or { mode: 'edit', quiz }
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizKind, setQuizKind] = useState('QUIZ');
  const [quizTimeLimit, setQuizTimeLimit] = useState(30);
  const [quizSelectedQuestionIds, setQuizSelectedQuestionIds] = useState([]);
  const [quizModalLoading, setQuizModalLoading] = useState(false);
  const [quizModalError, setQuizModalError] = useState('');
  const [previewQuiz, setPreviewQuiz] = useState(null); // quiz object or null

  // 4. LINK RESOURCES STATE
  const [resources, setResources] = useState([]);
  const [resourceModal, setResourceModal] = useState(null); // { mode: 'create' } or { mode: 'edit', resource }
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resTopicId, setResTopicId] = useState('');
  const [resModalLoading, setResModalLoading] = useState(false);
  const [resModalError, setResModalError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjData, topicsData, questionsData, quizzesData, resourcesData] = await Promise.all([
        teacherService.getSubject(subjectId),
        teacherService.getTopics(subjectId),
        teacherService.getQuestions(subjectId),
        teacherService.getQuizzes(subjectId),
        teacherService.getResources(subjectId),
      ]);
      setSubject(subjData);
      setTopics(topicsData);
      setQuestions(questionsData);
      setQuizzes(quizzesData);
      setResources(resourcesData);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      if (err.status === 404) {
        setError('Subject not found or you do not have permission to view it.');
        return;
      }
      setError(err.message || 'Failed to load subject content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [subjectId]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  // =========================================================================
  // TOPIC HANDLERS
  // =========================================================================

  const handleOpenCreateTopic = () => {
    setTopicName('');
    setTopicDescription('');
    setTopicModalError('');
    setTopicModal({ mode: 'create' });
  };

  const handleOpenEditTopic = (topic) => {
    setTopicName(topic.name);
    setTopicDescription(topic.description || '');
    setTopicModalError('');
    setTopicModal({ mode: 'edit', topic });
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    const trimmed = topicName.trim();
    if (!trimmed) {
      setTopicModalError('Topic name is required.');
      return;
    }
    setTopicModalLoading(true);
    setTopicModalError('');
    try {
      if (topicModal.mode === 'create') {
        const created = await teacherService.createTopic(subjectId, {
          name: trimmed,
          description: topicDescription.trim() || null,
        });
        setTopics((prev) => [...prev, created]);
        setTopicModal(null);
        showToast(`Topic "${created.name}" created!`);
      } else {
        const updated = await teacherService.updateTopic(subjectId, topicModal.topic.id, {
          name: trimmed,
          description: topicDescription.trim() || null,
        });
        setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setTopicModal(null);
        showToast(`Topic "${updated.name}" updated.`);
      }
    } catch (err) {
      setTopicModalError(err.message || 'Failed to save topic.');
    } finally {
      setTopicModalLoading(false);
    }
  };

  const handleMoveTopic = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const reordered = [...topics];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistic update
    setTopics(reordered);

    try {
      const topicIds = reordered.map((t) => t.id);
      const serverTopics = await teacherService.reorderTopics(subjectId, topicIds);
      setTopics(serverTopics);
    } catch (err) {
      // Revert on error
      setError(err.message || 'Failed to reorder topics.');
      loadAll();
    }
  };

  const handleArchiveTopic = async (topic) => {
    if (!window.confirm(`Archive topic "${topic.name}"? Existing questions will remain associated.`)) return;
    try {
      const updated = await teacherService.archiveTopic(subjectId, topic.id);
      setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Topic "${topic.name}" archived.`);
    } catch (err) {
      setError(err.message || 'Failed to archive topic.');
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!window.confirm(`Permanently delete topic "${topic.name}"?`)) return;
    try {
      await teacherService.deleteTopic(subjectId, topic.id);
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
      showToast(`Topic "${topic.name}" deleted.`);
    } catch (err) {
      setError(err.message || 'Cannot delete topic. Archive it instead.');
    }
  };

  // =========================================================================
  // QUESTION BANK HANDLERS
  // =========================================================================

  const handleOpenCreateQuestion = () => {
    const activeTopics = topics.filter((t) => t.status === 'ACTIVE');
    setQTopicId(activeTopics.length > 0 ? activeTopics[0].id.toString() : '');
    setQText('');
    setQExplanation('');
    setQDifficulty('MEDIUM');
    setQPoints(1.0);
    setQChoices([
      { label: 'A', text: '', isCorrect: true },
      { label: 'B', text: '', isCorrect: false },
      { label: 'C', text: '', isCorrect: false },
      { label: 'D', text: '', isCorrect: false },
    ]);
    setQModalError('');
    setQuestionModal({ mode: 'create' });
  };

  const handleOpenEditQuestion = (q) => {
    setQTopicId(q.topicId ? q.topicId.toString() : '');
    setQText(q.text);
    setQExplanation(q.explanation || '');
    setQDifficulty(q.difficulty);
    setQPoints(q.points || 1.0);
    setQChoices(
      q.choices && q.choices.length > 0
        ? q.choices.map((c, i) => ({
            label: String.fromCharCode(65 + i),
            text: c.text,
            isCorrect: c.isCorrect,
          }))
        : [
            { label: 'A', text: '', isCorrect: true },
            { label: 'B', text: '', isCorrect: false },
          ]
    );
    setQModalError('');
    setQuestionModal({ mode: 'edit', question: q });
  };

  const handleAddChoice = () => {
    if (qChoices.length >= 6) return;
    const nextLabel = String.fromCharCode(65 + qChoices.length);
    setQChoices([...qChoices, { label: nextLabel, text: '', isCorrect: false }]);
  };

  const handleRemoveChoice = (index) => {
    if (qChoices.length <= 2) return;
    const updated = qChoices.filter((_, i) => i !== index);
    // Re-label
    const relabeled = updated.map((c, i) => ({
      ...c,
      label: String.fromCharCode(65 + i),
    }));
    // Ensure at least one choice is correct
    if (!relabeled.some((c) => c.isCorrect)) {
      relabeled[0].isCorrect = true;
    }
    setQChoices(relabeled);
  };

  const handleSetCorrectChoice = (index) => {
    setQChoices(
      qChoices.map((c, i) => ({
        ...c,
        isCorrect: i === index,
      }))
    );
  };

  const handleChoiceTextChange = (index, text) => {
    setQChoices(
      qChoices.map((c, i) => (i === index ? { ...c, text } : c))
    );
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = qText.trim();
    if (!trimmedText) {
      setQModalError('Question prompt is required.');
      return;
    }
    if (!qTopicId) {
      setQModalError('Please select a topic.');
      return;
    }
    const emptyChoices = qChoices.some((c) => !c.text.trim());
    if (emptyChoices) {
      setQModalError('All choices must have text.');
      return;
    }
    const correctCount = qChoices.filter((c) => c.isCorrect).length;
    if (correctCount !== 1) {
      setQModalError('Exactly one choice must be marked as correct.');
      return;
    }

    const payload = {
      topicId: Number(qTopicId),
      text: trimmedText,
      explanation: qExplanation.trim() || '',
      difficulty: qDifficulty,
      points: Number(qPoints) > 0 ? Number(qPoints) : 1.0,
      choices: qChoices.map((c) => ({
        label: c.label,
        text: c.text.trim(),
        isCorrect: c.isCorrect,
      })),
    };

    setQModalLoading(true);
    setQModalError('');
    try {
      if (questionModal.mode === 'create') {
        const created = await teacherService.createQuestion(subjectId, payload);
        setQuestions((prev) => [created, ...prev]);
        setQuestionModal(null);
        showToast(`Question created (v1)!`);
      } else {
        const updated = await teacherService.updateQuestion(subjectId, questionModal.question.id, payload);
        if (updated.id !== questionModal.question.id) {
          // Versioned! Replace old question or add new and mark old retired
          setQuestions((prev) => [
            updated,
            ...prev.map((q) => (q.id === questionModal.question.id ? { ...q, status: 'RETIRED' } : q)),
          ]);
          showToast(`Question updated! Created new version v${updated.version} (v${questionModal.question.version} retired).`);
        } else {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          showToast(`Question updated in-place (v1).`);
        }
        setQuestionModal(null);
      }
    } catch (err) {
      setQModalError(err.message || 'Failed to save question.');
    } finally {
      setQModalLoading(false);
    }
  };

  const handleDuplicateQuestion = async (q) => {
    try {
      const duplicated = await teacherService.duplicateQuestion(subjectId, q.id);
      setQuestions((prev) => [duplicated, ...prev]);
      showToast(`Question duplicated as new active question.`);
    } catch (err) {
      setError(err.message || 'Failed to duplicate question.');
    }
  };

  const handleRetireQuestion = async (q) => {
    if (!window.confirm(`Retire question? It will remain in existing quizzes and attempts, but cannot be added to new quizzes.`)) return;
    try {
      const retired = await teacherService.retireQuestion(subjectId, q.id);
      setQuestions((prev) => prev.map((item) => (item.id === retired.id ? retired : item)));
      showToast(`Question retired.`);
    } catch (err) {
      setError(err.message || 'Failed to retire question.');
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm(`Permanently delete this question?`)) return;
    try {
      await teacherService.deleteQuestion(subjectId, q.id);
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      showToast(`Question deleted.`);
    } catch (err) {
      setError(err.message || 'Cannot delete answered or quiz question. Retire it instead.');
    }
  };

  // =========================================================================
  // QUIZ HANDLERS
  // =========================================================================

  const handleOpenCreateQuiz = () => {
    setQuizTitle('');
    setQuizDescription('');
    setQuizKind('QUIZ');
    setQuizTimeLimit(30);
    // default select first 5 active questions
    const activeQIds = questions.filter((q) => q.status === 'ACTIVE').slice(0, 5).map((q) => q.id);
    setQuizSelectedQuestionIds(activeQIds);
    setQuizModalError('');
    setQuizModal({ mode: 'create' });
  };

  const handleOpenEditQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description || '');
    setQuizKind(quiz.kind || 'QUIZ');
    setQuizTimeLimit(quiz.timeLimitMinutes || 30);
    setQuizSelectedQuestionIds(quiz.questions ? quiz.questions.map((q) => q.questionId) : []);
    setQuizModalError('');
    setQuizModal({ mode: 'edit', quiz });
  };

  const handleToggleQuizQuestion = (qId) => {
    setQuizSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = quizTitle.trim();
    if (!trimmedTitle) {
      setQuizModalError('Quiz title is required.');
      return;
    }
    if (quizSelectedQuestionIds.length === 0) {
      setQuizModalError('Please select at least one question for the quiz.');
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: quizDescription.trim() || null,
      kind: quizKind,
      timeLimitMinutes: Number(quizTimeLimit) > 0 ? Number(quizTimeLimit) : 30,
      questionIds: quizSelectedQuestionIds,
    };

    setQuizModalLoading(true);
    setQuizModalError('');
    try {
      if (quizModal.mode === 'create') {
        const created = await teacherService.createQuiz(subjectId, payload);
        setQuizzes((prev) => [created, ...prev]);
        setQuizModal(null);
        showToast(`Quiz "${created.title}" created as Draft!`);
      } else {
        const updated = await teacherService.updateQuiz(subjectId, quizModal.quiz.id, payload);
        setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        setQuizModal(null);
        showToast(`Quiz "${updated.title}" updated.`);
      }
    } catch (err) {
      setQuizModalError(err.message || 'Failed to save quiz.');
    } finally {
      setQuizModalLoading(false);
    }
  };

  const handlePublishQuiz = async (quiz) => {
    if (!window.confirm(`Publish "${quiz.title}"? Students in your classes will be able to take it.`)) return;
    try {
      const published = await teacherService.publishQuiz(subjectId, quiz.id);
      setQuizzes((prev) => prev.map((q) => (q.id === published.id ? published : q)));
      showToast(`Quiz "${quiz.title}" is now PUBLISHED!`);
    } catch (err) {
      setError(err.message || 'Failed to publish quiz.');
    }
  };

  const handleUnpublishQuiz = async (quiz) => {
    try {
      const draft = await teacherService.unpublishQuiz(subjectId, quiz.id);
      setQuizzes((prev) => prev.map((q) => (q.id === draft.id ? draft : q)));
      showToast(`Quiz "${quiz.title}" returned to DRAFT.`);
    } catch (err) {
      setError(err.message || 'Cannot unpublish quiz with submitted student attempts.');
    }
  };

  const handleDuplicateQuiz = async (quiz) => {
    try {
      const duplicated = await teacherService.duplicateQuiz(subjectId, quiz.id);
      setQuizzes((prev) => [duplicated, ...prev]);
      showToast(`Quiz duplicated as new draft "${duplicated.title}".`);
    } catch (err) {
      setError(err.message || 'Failed to duplicate quiz.');
    }
  };

  const handleArchiveQuiz = async (quiz) => {
    if (!window.confirm(`Archive "${quiz.title}"?`)) return;
    try {
      const archived = await teacherService.archiveQuiz(subjectId, quiz.id);
      setQuizzes((prev) => prev.map((q) => (q.id === archived.id ? archived : q)));
      showToast(`Quiz "${quiz.title}" archived.`);
    } catch (err) {
      setError(err.message || 'Failed to archive quiz.');
    }
  };

  // =========================================================================
  // LINK RESOURCE HANDLERS
  // =========================================================================

  const handleOpenCreateResource = () => {
    setResTitle('');
    setResUrl('');
    setResDescription('');
    setResTopicId('');
    setResModalError('');
    setResourceModal({ mode: 'create' });
  };

  const handleOpenEditResource = (r) => {
    setResTitle(r.title);
    setResUrl(r.url);
    setResDescription(r.description || '');
    setResTopicId(r.topicId ? r.topicId.toString() : '');
    setResModalError('');
    setResourceModal({ mode: 'edit', resource: r });
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = resTitle.trim();
    const trimmedUrl = resUrl.trim();
    if (!trimmedTitle) {
      setResModalError('Resource title is required.');
      return;
    }
    if (!trimmedUrl) {
      setResModalError('URL is required.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setResModalError('URL must begin with http:// or https://');
      return;
    }
    if (trimmedUrl.length > 2000) {
      setResModalError('URL cannot exceed 2000 characters.');
      return;
    }

    const payload = {
      title: trimmedTitle,
      url: trimmedUrl,
      description: resDescription.trim() || null,
      topicId: resTopicId ? Number(resTopicId) : null,
    };

    setResModalLoading(true);
    setResModalError('');
    try {
      if (resourceModal.mode === 'create') {
        const created = await teacherService.createResource(subjectId, payload);
        setResources((prev) => [created, ...prev]);
        setResourceModal(null);
        showToast(`Link resource added!`);
      } else {
        const updated = await teacherService.updateResource(subjectId, resourceModal.resource.id, payload);
        setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setResourceModal(null);
        showToast(`Link resource updated.`);
      }
    } catch (err) {
      setResModalError(err.message || 'Failed to save resource.');
    } finally {
      setResModalLoading(false);
    }
  };

  const handleArchiveResource = async (r) => {
    if (!window.confirm(`Archive "${r.title}"?`)) return;
    try {
      const archived = await teacherService.archiveResource(subjectId, r.id);
      setResources((prev) => prev.map((item) => (item.id === archived.id ? archived : item)));
      showToast(`Resource archived.`);
    } catch (err) {
      setError(err.message || 'Failed to archive resource.');
    }
  };

  const handleDeleteResource = async (r) => {
    if (!window.confirm(`Permanently delete "${r.title}"?`)) return;
    try {
      await teacherService.deleteResource(subjectId, r.id);
      setResources((prev) => prev.filter((item) => item.id !== r.id));
      showToast(`Resource deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete resource.');
    }
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    if (questionFilterTopic && String(q.topicId) !== String(questionFilterTopic)) return false;
    if (questionFilterDifficulty && q.difficulty !== questionFilterDifficulty) return false;
    if (questionFilterStatus && q.status !== questionFilterStatus) return false;
    if (questionSearch.trim()) {
      const s = questionSearch.trim().toLowerCase();
      const inText = q.text && q.text.toLowerCase().includes(s);
      const inExpl = q.explanation && q.explanation.toLowerCase().includes(s);
      if (!inText && !inExpl) return false;
    }
    return true;
  });

  return (
    <PortalShell
      portalSubtitle="Teacher Course Authoring"
      skipLabel="Skip to subject content"
      user={user}
      onLogout={logout}
      badgeIcon={BookOpen}
      badgeLabel="Course Authoring"
      badgeColorClass="bg-highlighter-mint text-ink"
      title={subject?.name || 'Subject Workspace'}
      subtitle={`Code: ${subject?.code || ''} · Manage curriculum topics, versioned questions, quizzes, and resources.`}
    >
      <div className="w-full space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
          <Link to="/teacher" className="hover:underline hover:text-ink dark:hover:text-chalkboard-chalk">
            Teacher Home
          </Link>
          <span>/</span>
          <Link to="/teacher/subjects" className="hover:underline hover:text-ink dark:hover:text-chalkboard-chalk">
            My Subjects
          </Link>
          <span>/</span>
          <span className="text-ink dark:text-chalkboard-chalk font-bold">{subject?.name}</span>
        </div>

        {/* Toast */}
        {successToast && (
          <div
            role="status"
            className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast('')}
              className="text-xs uppercase font-mono font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Error */}
        {error && (
          <div className="p-4 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
            <button onClick={() => setError('')} className="font-mono text-xs uppercase hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-9 h-9 animate-spin mx-auto text-redpen" />
            <p className="font-hand text-2xl text-ink-muted dark:text-chalkboard-muted">
              Loading course authoring workspace…
            </p>
          </div>
        )}

        {!loading && subject && (
          <>
            {/* Subject Overview Card */}
            <NotebookCard pattern="ruled" borderStyle="sketch" className="p-6 bg-paper-card dark:bg-chalkboard-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink border border-ink/20">
                      {subject.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        subject.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {subject.status}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-chalkboard-chalk">
                    {subject.name}
                  </h1>
                  {subject.description && (
                    <p className="text-sm text-ink-muted dark:text-chalkboard-muted max-w-3xl leading-relaxed">
                      {subject.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    to={`/teacher`}
                    variant="secondary"
                    size="sm"
                    className="shadow-notebook-sm"
                  >
                    <span>View Classes</span>
                  </Button>
                </div>
              </div>

              {/* 4 Tabs */}
              <div className="pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('topics')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'topics'
                      ? 'bg-ink text-paper dark:bg-chalkboard-chalk dark:text-chalkboard shadow-notebook-sm'
                      : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink hover:bg-paper-warm/80'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Topics ({topics.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'questions'
                      ? 'bg-ink text-paper dark:bg-chalkboard-chalk dark:text-chalkboard shadow-notebook-sm'
                      : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink hover:bg-paper-warm/80'
                  }`}
                >
                  <FileQuestion className="w-4 h-4" />
                  <span>Question Bank ({questions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('quizzes')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'quizzes'
                      ? 'bg-ink text-paper dark:bg-chalkboard-chalk dark:text-chalkboard shadow-notebook-sm'
                      : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink hover:bg-paper-warm/80'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Quizzes ({quizzes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'resources'
                      ? 'bg-ink text-paper dark:bg-chalkboard-chalk dark:text-chalkboard shadow-notebook-sm'
                      : 'bg-paper-warm dark:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink hover:bg-paper-warm/80'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Link Resources ({resources.length})</span>
                </button>
              </div>
            </NotebookCard>

            {/* TAB 1: TOPICS */}
            {activeTab === 'topics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                      Curriculum Topics
                    </h2>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Topics establish the knowledge areas used for gap analysis and diagnostic mastery.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateTopic}
                    className="shadow-notebook"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>New Topic</span>
                  </Button>
                </div>

                {topics.length === 0 ? (
                  <NotebookCard className="p-8 text-center space-y-3 bg-paper-card dark:bg-chalkboard-card">
                    <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No topics defined yet</p>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-sm mx-auto">
                      Add curriculum topics so you can organize question bank items and measure student concept mastery.
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleOpenCreateTopic}>
                      Create First Topic
                    </Button>
                  </NotebookCard>
                ) : (
                  <div className="space-y-3">
                    {topics.map((t, idx) => (
                      <NotebookCard
                        key={t.id}
                        pattern="ruled"
                        className="p-4 bg-paper-card dark:bg-chalkboard-card flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          {/* Order buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveTopic(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface disabled:opacity-25 cursor-pointer text-ink-muted dark:text-chalkboard-muted"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveTopic(idx, 'down')}
                              disabled={idx === topics.length - 1}
                              className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface disabled:opacity-25 cursor-pointer text-ink-muted dark:text-chalkboard-muted"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="w-6 h-6 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border text-xs font-mono font-bold flex items-center justify-center text-ink dark:text-chalkboard-chalk">
                            {t.displayOrder}
                          </span>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                                {t.name}
                              </h3>
                              {t.status === 'ARCHIVED' && (
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-ink/10 text-ink-muted">
                                  Archived
                                </span>
                              )}
                            </div>
                            {t.description && (
                              <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted hidden sm:inline">
                            {t.questionCount} questions · {t.resourceCount} links
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditTopic(t)}
                              className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                              title="Edit topic"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {t.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleArchiveTopic(t)}
                                className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-amber-600 cursor-pointer"
                                title="Archive topic"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                            {t.questionCount === 0 && t.resourceCount === 0 && (
                              <button
                                onClick={() => handleDeleteTopic(t)}
                                className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-redpen cursor-pointer"
                                title="Delete unused topic"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </NotebookCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUESTION BANK */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                      Versioned Question Bank
                    </h2>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Editing answered questions automatically retires the old version and creates a new one, keeping gap analysis history intact.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateQuestion}
                    className="shadow-notebook"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>New Question</span>
                  </Button>
                </div>

                {/* Filters Row */}
                <div className="p-3.5 rounded-2xl bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-chalkboard-borderSubtle flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted dark:text-chalkboard-muted" />
                    <input
                      type="text"
                      placeholder="Search question prompts or explanations…"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk focus:outline-none focus:border-redpen"
                    />
                  </div>

                  <select
                    value={questionFilterTopic}
                    onChange={(e) => setQuestionFilterTopic(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-mono"
                  >
                    <option value="">All Topics</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={questionFilterDifficulty}
                    onChange={(e) => setQuestionFilterDifficulty(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-mono"
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>

                  <select
                    value={questionFilterStatus}
                    onChange={(e) => setQuestionFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm dark:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk font-mono"
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>

                {filteredQuestions.length === 0 ? (
                  <NotebookCard className="p-8 text-center space-y-3 bg-paper-card dark:bg-chalkboard-card">
                    <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No questions match the current filters</p>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Add multiple-choice questions to build diagnostic assessments and practice quizzes.
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleOpenCreateQuestion}>
                      Create Question
                    </Button>
                  </NotebookCard>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => (
                      <NotebookCard
                        key={q.id}
                        pattern="grid"
                        className="p-5 bg-paper-card dark:bg-chalkboard-card space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink border border-ink/20">
                              {q.topicName}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-redpen dark:text-highlighter-yellow">
                              v{q.version}
                            </span>
                            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                              Lineage #{q.lineageId}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                q.difficulty === 'EASY'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : q.difficulty === 'HARD'
                                  ? 'bg-red-100 text-red-900 border border-red-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                              {q.points} pt{q.points === 1 ? '' : 's'}
                            </span>
                            {q.status === 'RETIRED' && (
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-ink/10 text-ink-muted border border-ink/10">
                                Retired
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                              title="Edit question"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                              title="Duplicate as new question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {q.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleRetireQuestion(q)}
                                className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-amber-600 cursor-pointer"
                                title="Retire from new quizzes"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!q.hasAnswers && !q.inQuiz && (
                              <button
                                onClick={() => handleDeleteQuestion(q)}
                                className="p-1 rounded hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-redpen cursor-pointer"
                                title="Delete unused question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Prompt */}
                        <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk whitespace-pre-wrap leading-relaxed">
                          {q.text}
                        </p>

                        {/* Choices */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.choices &&
                            q.choices.map((c) => (
                              <div
                                key={c.id || c.label}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                  c.isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : 'bg-paper-warm dark:bg-chalkboard-surface border-ink/10 dark:border-chalkboard-borderSubtle text-ink dark:text-chalkboard-chalk'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-ink/10 dark:bg-chalkboard-border flex items-center justify-center font-mono text-[10px]">
                                    {c.label}
                                  </span>
                                  <span>{c.text}</span>
                                </div>
                                {c.isCorrect && (
                                  <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    Correct
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="p-3 rounded-xl bg-paper-warm/70 dark:bg-chalkboard-surface/70 border border-ink/10 dark:border-chalkboard-borderSubtle text-xs space-y-1">
                            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-chalkboard-muted">
                              Explanation & Misconception Review
                            </span>
                            <p className="text-ink dark:text-chalkboard-chalk whitespace-pre-wrap">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </NotebookCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: QUIZZES */}
            {activeTab === 'quizzes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                      Quizzes & Assessments
                    </h2>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Build assessments from your question bank. Publishing freezes questions once students start submitting attempts.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateQuiz}
                    className="shadow-notebook"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>New Quiz</span>
                  </Button>
                </div>

                {quizzes.length === 0 ? (
                  <NotebookCard className="p-8 text-center space-y-3 bg-paper-card dark:bg-chalkboard-card">
                    <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No quizzes created yet</p>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Combine questions into timed assessments or comprehensive diagnostics for your classes.
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleOpenCreateQuiz}>
                      Build First Quiz
                    </Button>
                  </NotebookCard>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                      <NotebookCard
                        key={quiz.id}
                        pattern="ruled"
                        className="p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  quiz.status === 'PUBLISHED'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : quiz.status === 'DRAFT'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-ink/10 text-ink-muted border-ink/20'
                                }`}
                              >
                                {quiz.status}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-paper-warm text-ink-muted border border-ink/10">
                                {quiz.kind || 'QUIZ'}
                              </span>
                            </div>

                            <span className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                              {quiz.attemptCount} attempt{quiz.attemptCount === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-ink dark:text-chalkboard-chalk">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5 line-clamp-2">
                                {quiz.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono text-ink-muted dark:text-chalkboard-muted pt-1">
                            <span>{quiz.questionCount} questions</span>
                            <span>{quiz.timeLimitMinutes || 30} mins</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => setPreviewQuiz(quiz)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {quiz.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditQuiz(quiz)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink cursor-pointer"
                                >
                                  Edit
                                </button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handlePublishQuiz(quiz)}
                                >
                                  Publish
                                </Button>
                              </>
                            )}

                            {quiz.status === 'PUBLISHED' && (
                              <>
                                {quiz.attemptCount === 0 && (
                                  <button
                                    onClick={() => handleUnpublishQuiz(quiz)}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-paper-warm text-amber-700 cursor-pointer"
                                    title="Return to draft to edit questions"
                                  >
                                    Unpublish
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDuplicateQuiz(quiz)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                                  title="Duplicate as new draft"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  onClick={() => handleArchiveQuiz(quiz)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-paper-warm text-amber-700 cursor-pointer"
                                >
                                  Archive
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </NotebookCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk">
                      Link Resources
                    </h2>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Add external documentation, guides, or video links. Topic-tagged links appear in student recommendation cards; untagged links appear in class study materials.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateResource}
                    className="shadow-notebook"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>New Link</span>
                  </Button>
                </div>

                {resources.length === 0 ? (
                  <NotebookCard className="p-8 text-center space-y-3 bg-paper-card dark:bg-chalkboard-card">
                    <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No link resources added yet</p>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Share helpful documentation, tutorials, or reference links with your students.
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleOpenCreateResource}>
                      Add First Link
                    </Button>
                  </NotebookCard>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resources.map((r) => (
                      <NotebookCard
                        key={r.id}
                        pattern="ruled"
                        className="p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-highlighter-mint/30 text-ink border border-ink/20">
                              {r.domain || 'External Link'}
                            </span>
                            {r.topicName ? (
                              <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted truncate max-w-[150px]">
                                Topic: {r.topicName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                                General Study Material
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                              {r.title}
                            </h3>
                            {r.description && (
                              <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                                {r.description}
                              </p>
                            )}
                          </div>

                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-ink dark:text-chalkboard-chalk font-mono hover:underline break-all"
                          >
                            <span>{r.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>

                        <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditResource(r)}
                            className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                            title="Edit link"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveResource(r)}
                            className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-amber-600 cursor-pointer"
                            title="Archive link"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(r)}
                            className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-redpen cursor-pointer"
                            title="Delete link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </NotebookCard>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* MODAL: TOPIC CREATE / EDIT */}
        {/* ================================================================= */}
        {topicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                  {topicModal.mode === 'create' ? 'Create New Topic' : 'Edit Topic'}
                </h3>
                <button
                  onClick={() => setTopicModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {topicModalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{topicModalError}</span>
                </div>
              )}

              <form onSubmit={handleTopicSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Topic Name <span className="text-redpen">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="e.g. Memory Management, Dynamic Programming"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={topicDescription}
                    onChange={(e) => setTopicDescription(e.target.value)}
                    placeholder="Brief description of learning objectives covered under this topic…"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setTopicModal(null)}
                    disabled={topicModalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={topicModalLoading}
                    className="shadow-notebook"
                  >
                    {topicModalLoading ? 'Saving…' : 'Save Topic'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: QUESTION CREATE / EDIT (WITH VERSIONING WARNING) */}
        {/* ================================================================= */}
        {questionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    {questionModal.mode === 'create'
                      ? 'Create New Question'
                      : `Edit Question (v${questionModal.question.version})`}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Multiple-choice question with 2 to 6 choices and exactly one correct answer.
                  </p>
                </div>
                <button
                  onClick={() => setQuestionModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Versioning Alert Banner when editing answered question */}
              {questionModal.mode === 'edit' && questionModal.question.hasAnswers && (
                <div className="p-3.5 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Automatic Versioning Enabled</span>
                    <p className="leading-relaxed">
                      This question has already been answered by students. Saving changes will preserve existing attempt history on{' '}
                      <strong>v{questionModal.question.version}</strong> and automatically create a new version{' '}
                      <strong>v{questionModal.question.version + 1}</strong>. The old version will be retired from new quizzes.
                    </p>
                  </div>
                </div>
              )}

              {qModalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{qModalError}</span>
                </div>
              )}

              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Topic <span className="text-redpen">*</span>
                    </label>
                    <select
                      value={qTopicId}
                      onChange={(e) => setQTopicId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                    >
                      <option value="">Select Topic…</option>
                      {topics
                        .filter((t) => t.status === 'ACTIVE')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Difficulty
                    </label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={qPoints}
                      onChange={(e) => setQPoints(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Question Prompt <span className="text-redpen">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={2000}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Enter the question prompt clearly…"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                  <div className="text-right text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5">
                    {qText.length}/2000
                  </div>
                </div>

                {/* Choices list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                      Answer Choices (2 to 6, select single correct answer) <span className="text-redpen">*</span>
                    </label>
                    {qChoices.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddChoice}
                        className="text-xs font-mono font-bold text-redpen hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Choice</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {qChoices.map((choice, idx) => (
                      <div
                        key={choice.label}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                          choice.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500'
                            : 'bg-paper-warm dark:bg-chalkboard-surface border-ink/20 dark:border-chalkboard-borderSubtle'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSetCorrectChoice(idx)}
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                            choice.isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-ink/10 text-ink-muted hover:bg-ink/20'
                          }`}
                          title={choice.isCorrect ? 'Correct choice' : 'Click to mark as correct'}
                        >
                          {choice.label}
                        </button>

                        <input
                          type="text"
                          required
                          value={choice.text}
                          onChange={(e) => handleChoiceTextChange(idx, e.target.value)}
                          placeholder={`Option ${choice.label} text…`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-ink/20 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                        />

                        {choice.isCorrect && (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">
                            Correct
                          </span>
                        )}

                        {qChoices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(idx)}
                            className="p-1 text-ink-muted hover:text-redpen cursor-pointer"
                            title="Remove choice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Explanation & Misconception Review
                  </label>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    placeholder="Provide targeted feedback explaining why the correct choice is right and common pitfalls…"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                  />
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setQuestionModal(null)}
                    disabled={qModalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={qModalLoading}
                    className="shadow-notebook"
                  >
                    {qModalLoading ? 'Saving…' : 'Save Question'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: QUIZ CREATE / EDIT */}
        {/* ================================================================= */}
        {quizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    {quizModal.mode === 'create' ? 'Create New Quiz' : 'Edit Quiz'}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Select active questions from your subject bank.
                  </p>
                </div>
                <button
                  onClick={() => setQuizModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {quizModalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{quizModalError}</span>
                </div>
              )}

              <form onSubmit={handleQuizSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Quiz Title <span className="text-redpen">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Midterm Diagnostic Assessment"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Time Limit (Mins)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={quizTimeLimit}
                      onChange={(e) => setQuizTimeLimit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="Instructions or scope for students taking this quiz…"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                  />
                </div>

                {/* Question Picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                      Select Questions ({quizSelectedQuestionIds.length} selected) <span className="text-redpen">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuizSelectedQuestionIds(
                            questions.filter((q) => q.status === 'ACTIVE').map((q) => q.id)
                          )
                        }
                        className="text-[10px] font-mono text-redpen hover:underline cursor-pointer"
                      >
                        Select All Active
                      </button>
                      <span className="text-ink-muted">·</span>
                      <button
                        type="button"
                        onClick={() => setQuizSelectedQuestionIds([])}
                        className="text-[10px] font-mono text-ink-muted hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface">
                    {questions
                      .filter((q) => q.status === 'ACTIVE')
                      .map((q) => {
                        const checked = quizSelectedQuestionIds.includes(q.id);
                        return (
                          <label
                            key={q.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-colors ${
                              checked
                                ? 'bg-paper-card dark:bg-chalkboard-card border-redpen shadow-xs'
                                : 'bg-transparent border-transparent hover:bg-paper-card/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleQuizQuestion(q.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-highlighter-yellow/30 text-ink">
                                  {q.topicName}
                                </span>
                                <span className="text-[10px] font-mono text-ink-muted">v{q.version}</span>
                                <span className="text-[10px] font-mono text-ink-muted">({q.difficulty})</span>
                              </div>
                              <p className="text-ink dark:text-chalkboard-chalk font-medium line-clamp-2">
                                {q.text}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setQuizModal(null)}
                    disabled={quizModalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={quizModalLoading}
                    className="shadow-notebook"
                  >
                    {quizModalLoading ? 'Saving…' : 'Save Quiz'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: QUIZ PREVIEW */}
        {/* ================================================================= */}
        {previewQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-5 my-8">
              <div className="flex items-start justify-between border-b border-ink/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-highlighter-yellow/30 text-ink">
                    Student View Preview
                  </span>
                  <h3 className="text-xl font-bold text-ink dark:text-chalkboard-chalk mt-1">
                    {previewQuiz.title}
                  </h3>
                  {previewQuiz.description && (
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-0.5">
                      {previewQuiz.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPreviewQuiz(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {previewQuiz.questions &&
                  previewQuiz.questions.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-ink/20 dark:border-chalkboard-borderSubtle bg-paper-warm dark:bg-chalkboard-surface space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-redpen">
                          Question {idx + 1}
                        </span>
                        <span className="text-[10px] font-mono text-ink-muted">
                          {item.points || 1.0} point(s)
                        </span>
                      </div>
                      <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk whitespace-pre-wrap">
                        {item.text}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {item.choices &&
                          item.choices.map((c) => (
                            <div
                              key={c.id || c.label}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                                c.isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'bg-paper-card dark:bg-chalkboard-card border-ink/10 text-ink dark:text-chalkboard-chalk'
                              }`}
                            >
                              <span className="w-5 h-5 rounded bg-ink/10 flex items-center justify-center font-mono text-[10px]">
                                {c.label}
                              </span>
                              <span>{c.text}</span>
                              {c.isCorrect && (
                                <span className="ml-auto text-[10px] font-mono text-emerald-600">
                                  ✓ Key
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-3 border-t border-ink/10 flex justify-end">
                <Button variant="secondary" size="md" onClick={() => setPreviewQuiz(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: LINK RESOURCE CREATE / EDIT */}
        {/* ================================================================= */}
        {resourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    {resourceModal.mode === 'create' ? 'Add Link Resource' : 'Edit Link Resource'}
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    External link with strict http/https scheme validation.
                  </p>
                </div>
                <button
                  onClick={() => setResourceModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resModalError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{resModalError}</span>
                </div>
              )}

              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Resource Title <span className="text-redpen">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="e.g. Official Documentation, Video Walkthrough"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Target URL (http:// or https://) <span className="text-redpen">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    maxLength={2000}
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="https://example.com/guide"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen font-mono text-xs"
                  />
                  <span className="text-[10px] font-mono text-ink-muted mt-1 block">
                    Safe link opening in new tab. No server-side fetch.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Associate Topic (Optional)
                  </label>
                  <select
                    value={resTopicId}
                    onChange={(e) => setResTopicId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                  >
                    <option value="">None (General Class Study Material)</option>
                    {topics
                      .filter((t) => t.status === 'ACTIVE')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={resDescription}
                    onChange={(e) => setResDescription(e.target.value)}
                    placeholder="Summary of what students will learn from this link…"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                  />
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setResourceModal(null)}
                    disabled={resModalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={resModalLoading}
                    className="shadow-notebook"
                  >
                    {resModalLoading ? 'Saving…' : 'Save Link'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
