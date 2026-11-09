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
  Upload,
  FileText,
  Download,
  FileUp,
  Loader2,
  Bot,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { aiService } from '../services/aiService';
import {
  Button,
  NotebookCard,
  PortalShell,
} from '../components/NotebookPrimitives';
import { ConfirmModal } from '../components/ConfirmModal';

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

  // 5. FILE RESOURCES STATE (Phase B)
  const [files, setFiles] = useState([]);
  const [resourceSubTab, setResourceSubTab] = useState('files'); // 'files' | 'links'
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewModal, setPreviewModal] = useState(null); // { file, loading, error, data }
  const [editFileModal, setEditFileModal] = useState(null); // { file, title, description, topicId, loading, error }
  const [confirmState, setConfirmState] = useState(null); // { title, message, confirmLabel, cancelLabel, variant, loading, loadingLabel, isAlert, onConfirm }

  // 6. AI QUESTION DRAFTING STATE (Phase C)
  const [aiStatus, setAiStatus] = useState({ enabled: false, available: false, model: 'qwen/qwen3-14b', note: '' });
  const [aiSetupModal, setAiSetupModal] = useState(null); // { file }
  const [aiTopicId, setAiTopicId] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(10);
  const [aiSetupLoading, setAiSetupLoading] = useState(false);
  const [aiSetupError, setAiSetupError] = useState('');

  // Active Job & Polling
  const [activeAiJob, setActiveAiJob] = useState(null);
  const [aiCancelLoading, setAiCancelLoading] = useState(false);

  // Review Screen Modal
  const [reviewModal, setReviewModal] = useState(null); // { job, drafts, loading, error }
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'verified' | 'unverified' | 'approved' | 'rejected'
  const [selectedDraftIds, setSelectedDraftIds] = useState(new Set());
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);
  const [editDraftModal, setEditDraftModal] = useState(null); // { draft, loading, error }

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjData, topicsData, questionsData, quizzesData, resourcesData, filesData, aiStatusData] = await Promise.all([
        teacherService.getSubject(subjectId),
        teacherService.getTopics(subjectId),
        teacherService.getQuestions(subjectId),
        teacherService.getQuizzes(subjectId),
        teacherService.getResources(subjectId),
        teacherService.getFiles(subjectId),
        aiService.getStatus().catch(() => ({ enabled: false, available: false, model: 'qwen/qwen3-14b' })),
      ]);
      setSubject(subjData);
      setTopics(topicsData);
      setQuestions(questionsData);
      setQuizzes(quizzesData);
      setResources(resourcesData);
      setFiles(filesData || []);
      if (aiStatusData) setAiStatus(aiStatusData);
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

  // Polling for active AI generation job
  useEffect(() => {
    if (!activeAiJob || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(activeAiJob.status)) {
      return;
    }
    const timer = setInterval(async () => {
      try {
        const updated = await aiService.getJob(activeAiJob.id);
        setActiveAiJob(updated);
        if (updated.status === 'COMPLETED') {
          showToast(`AI drafted ${updated.draftsCount || ''} questions successfully!`);
          handleOpenReview(updated);
        } else if (updated.status === 'FAILED') {
          setError(updated.shortNote || 'AI generation failed.');
        }
      } catch (err) {
        console.error('Failed to poll AI generation job', err);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [activeAiJob?.id, activeAiJob?.status]);

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

  const handleConfirmAction = async () => {
    if (!confirmState?.onConfirm) {
      setConfirmState(null);
      return;
    }
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err) {
      setConfirmState(null);
    }
  };

  const handleArchiveTopic = (topic) => {
    setConfirmState({
      title: 'Archive Topic',
      message: `Archive topic "${topic.name}"? Existing questions will remain associated.`,
      confirmLabel: 'Archive Topic',
      variant: 'danger',
      loadingLabel: 'Archiving…',
      onConfirm: async () => {
        try {
          const updated = await teacherService.archiveTopic(subjectId, topic.id);
          setTopics((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          showToast(`Topic "${topic.name}" archived.`);
        } catch (err) {
          setError(err.message || 'Failed to archive topic.');
        }
      },
    });
  };

  const handleDeleteTopic = (topic) => {
    setConfirmState({
      title: 'Permanently Delete Topic',
      message: `Permanently delete topic "${topic.name}"?`,
      confirmLabel: 'Delete Topic',
      variant: 'danger',
      loadingLabel: 'Deleting…',
      onConfirm: async () => {
        try {
          await teacherService.deleteTopic(subjectId, topic.id);
          setTopics((prev) => prev.filter((t) => t.id !== topic.id));
          showToast(`Topic "${topic.name}" deleted.`);
        } catch (err) {
          setError(err.message || 'Cannot delete topic. Archive it instead.');
        }
      },
    });
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

  const handleRetireQuestion = (q) => {
    setConfirmState({
      title: 'Retire Question',
      message: 'Retire question? It will remain in existing quizzes and attempts, but cannot be added to new quizzes.',
      confirmLabel: 'Retire Question',
      variant: 'danger',
      loadingLabel: 'Retiring…',
      onConfirm: async () => {
        try {
          const retired = await teacherService.retireQuestion(subjectId, q.id);
          setQuestions((prev) => prev.map((item) => (item.id === retired.id ? retired : item)));
          showToast(`Question retired.`);
        } catch (err) {
          setError(err.message || 'Failed to retire question.');
        }
      },
    });
  };

  const handleDeleteQuestion = (q) => {
    setConfirmState({
      title: 'Permanently Delete Question',
      message: 'Permanently delete this question?',
      confirmLabel: 'Delete Question',
      variant: 'danger',
      loadingLabel: 'Deleting…',
      onConfirm: async () => {
        try {
          await teacherService.deleteQuestion(subjectId, q.id);
          setQuestions((prev) => prev.filter((item) => item.id !== q.id));
          showToast(`Question deleted.`);
        } catch (err) {
          setError(err.message || 'Cannot delete answered or quiz question. Retire it instead.');
        }
      },
    });
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

  const handlePublishQuiz = (quiz) => {
    setConfirmState({
      title: 'Publish Quiz',
      message: `Publish "${quiz.title}"? Students in your classes will immediately be able to take it.`,
      confirmLabel: 'Publish Quiz',
      variant: 'primary',
      loadingLabel: 'Publishing…',
      onConfirm: async () => {
        try {
          const published = await teacherService.publishQuiz(subjectId, quiz.id);
          setQuizzes((prev) => prev.map((q) => (q.id === published.id ? published : q)));
          showToast(`Quiz "${quiz.title}" is now PUBLISHED!`);
        } catch (err) {
          setError(err.message || 'Failed to publish quiz.');
        }
      },
    });
  };

  const handleUnpublishQuiz = (quiz) => {
    setConfirmState({
      title: 'Unpublish Quiz',
      message: `Return "${quiz.title}" to draft? Students will no longer be able to take this quiz until it is republished.`,
      confirmLabel: 'Unpublish Quiz',
      variant: 'danger',
      loadingLabel: 'Unpublishing…',
      onConfirm: async () => {
        try {
          const draft = await teacherService.unpublishQuiz(subjectId, quiz.id);
          setQuizzes((prev) => prev.map((q) => (q.id === draft.id ? draft : q)));
          showToast(`Quiz "${quiz.title}" returned to DRAFT.`);
        } catch (err) {
          setError(err.message || 'Cannot unpublish quiz with submitted student attempts.');
        }
      },
    });
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

  const handleArchiveQuiz = (quiz) => {
    setConfirmState({
      title: 'Archive Quiz',
      message: `Are you sure you want to archive "${quiz.title}"?`,
      confirmLabel: 'Archive Quiz',
      variant: 'danger',
      loadingLabel: 'Archiving…',
      onConfirm: async () => {
        try {
          const archived = await teacherService.archiveQuiz(subjectId, quiz.id);
          setQuizzes((prev) => prev.map((q) => (q.id === archived.id ? archived : q)));
          showToast(`Quiz "${quiz.title}" archived.`);
        } catch (err) {
          setError(err.message || 'Failed to archive quiz.');
        }
      },
    });
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

  const handleArchiveResource = (r) => {
    setConfirmState({
      title: 'Archive Resource',
      message: `Are you sure you want to archive "${r.title}"?`,
      confirmLabel: 'Archive Resource',
      variant: 'danger',
      loadingLabel: 'Archiving…',
      onConfirm: async () => {
        try {
          const archived = await teacherService.archiveResource(subjectId, r.id);
          setResources((prev) => prev.map((item) => (item.id === archived.id ? archived : item)));
          showToast(`Resource archived.`);
        } catch (err) {
          setError(err.message || 'Failed to archive resource.');
        }
      },
    });
  };

  const handleDeleteResource = (r) => {
    setConfirmState({
      title: 'Permanently Delete Resource',
      message: `Permanently delete "${r.title}"? This cannot be undone.`,
      confirmLabel: 'Delete Resource',
      variant: 'danger',
      loadingLabel: 'Deleting…',
      onConfirm: async () => {
        try {
          await teacherService.deleteResource(subjectId, r.id);
          setResources((prev) => prev.filter((item) => item.id !== r.id));
          showToast(`Resource deleted.`);
        } catch (err) {
          setError(err.message || 'Failed to delete resource.');
        }
      },
    });
  };

  // =========================================================================
  // FILE HANDLERS (Phase B)
  // =========================================================================

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileValidation = (file) => {
    if (!file) return null;
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isDocx = name.endsWith('.docx');
    if (!isPdf && !isDocx) {
      return 'Only PDF (.pdf) and Word documents (.docx) are allowed.';
    }
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      return 'File size exceeds the 10 MB limit.';
    }
    return null;
  };

  const handleSelectUploadFile = (file) => {
    setUploadError('');
    const validationErr = handleFileValidation(file);
    if (validationErr) {
      setUploadError(validationErr);
      setUploadFile(null);
      return;
    }
    setUploadFile(file);
    if (!uploadTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(baseName.replace(/[_-]/g, ' '));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose a PDF or DOCX file to upload.');
      return;
    }
    const validationErr = handleFileValidation(uploadFile);
    if (validationErr) {
      setUploadError(validationErr);
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Document title is required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle.trim());
    if (uploadDescription.trim()) {
      formData.append('description', uploadDescription.trim());
    }
    if (uploadTopicId) {
      formData.append('topicId', uploadTopicId);
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      const created = await teacherService.uploadFile(subjectId, formData);
      setFiles((prev) => [created, ...prev]);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTopicId('');
      setUploadModalOpen(false);
      showToast('Document uploaded and text extracted successfully!');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleOpenTextPreview = async (f) => {
    setPreviewModal({ file: f, loading: true, error: '', data: null });
    try {
      const data = await teacherService.getFileTextPreview(f.id);
      setPreviewModal({ file: f, loading: false, error: '', data });
    } catch (err) {
      setPreviewModal({ file: f, loading: false, error: err.message || 'Failed to load text preview.', data: null });
    }
  };

  const handleOpenEditFile = (f) => {
    setEditFileModal({
      file: f,
      title: f.title,
      description: f.description || '',
      topicId: f.topicId ? f.topicId.toString() : '',
      loading: false,
      error: '',
    });
  };

  const handleEditFileSubmit = async (e) => {
    e.preventDefault();
    if (!editFileModal?.title?.trim()) {
      setEditFileModal((prev) => ({ ...prev, error: 'Title is required.' }));
      return;
    }

    setEditFileModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const payload = {
        title: editFileModal.title.trim(),
        description: editFileModal.description.trim() || null,
        topicId: editFileModal.topicId ? Number(editFileModal.topicId) : null,
      };
      const updated = await teacherService.updateFile(editFileModal.file.id, payload);
      setFiles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditFileModal(null);
      showToast('File details updated.');
    } catch (err) {
      setEditFileModal((prev) => ({ ...prev, loading: false, error: err.message || 'Failed to update file.' }));
    }
  };

  const handleToggleArchiveFile = (f) => {
    const isArchived = f.status === 'ARCHIVED';
    const action = isArchived ? 'Restore' : 'Archive';
    setConfirmState({
      title: `${action} Document`,
      message: `Are you sure you want to ${action.toLowerCase()} "${f.title}"?`,
      confirmLabel: `${action} Document`,
      variant: isArchived ? 'primary' : 'danger',
      loadingLabel: `${isArchived ? 'Restoring' : 'Archiving'}…`,
      onConfirm: async () => {
        try {
          const updated = isArchived
            ? await teacherService.unarchiveFile(f.id)
            : await teacherService.archiveFile(f.id);
          setFiles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          showToast(`File ${isArchived ? 'restored' : 'archived'}.`);
        } catch (err) {
          setError(err.message || `Failed to ${action.toLowerCase()} file.`);
        }
      },
    });
  };

  const handleOpenDeleteFile = (f) => {
    setConfirmState({
      title: 'Permanently Delete Document?',
      message: (
        <div className="space-y-2">
          <p>
            Are you sure you want to delete <strong className="text-ink dark:text-chalkboard-chalk">{f.title}</strong> ({f.fileName})?
          </p>
          <p className="text-xs text-redpen font-mono">
            This will permanently remove the stored file and its extracted text from the system.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-mono">
            Note: Files referenced by approved questions in your Question Bank cannot be deleted. If you only wish to hide the file from students, please archive it instead.
          </p>
        </div>
      ),
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
      loadingLabel: 'Deleting…',
      onConfirm: async () => {
        try {
          await teacherService.deleteFile(f.id);
          setFiles((prev) => prev.filter((item) => item.id !== f.id));
          showToast('File deleted permanently.');
        } catch (err) {
          const msg = err.status === 409
            ? 'This file cannot be deleted because questions in your bank were drafted from it. You can archive this file instead to hide it from students.'
            : (err.message || 'Failed to delete file.');
          setError(msg);
        }
      },
    });
  };

  // =========================================================================
  // AI QUESTION DRAFTING HANDLERS (Phase C)
  // =========================================================================

  const handleOpenAiSetup = (f) => {
    if (f.extractionStatus !== 'READY') return;
    setAiSetupModal({ file: f });
    setAiTopicId(f.topicId ? f.topicId.toString() : (topics[0]?.id?.toString() || ''));
    setAiQuestionCount(10);
    setAiSetupError('');
  };

  const handleStartAiGeneration = async (e) => {
    e.preventDefault();
    if (!aiSetupModal?.file) return;
    if (!aiTopicId) {
      setAiSetupError('Please select a curriculum topic for the drafted questions.');
      return;
    }
    setAiSetupLoading(true);
    setAiSetupError('');
    try {
      const payload = {
        topicId: Number(aiTopicId),
        requestedCount: Number(aiQuestionCount) || 10,
      };
      const job = await aiService.createJob(subjectId, aiSetupModal.file.id, payload);
      setAiSetupModal(null);
      setActiveAiJob(job);
      showToast('AI question drafting started. Analyzing file content...');
    } catch (err) {
      if (err.status === 409) {
        setAiSetupError('You already have a generation job in progress. Please wait for it to complete or cancel it.');
      } else if (err.status === 429) {
        setAiSetupError('Hourly generation limit reached (5 jobs/hour). Please try again later.');
      } else if (err.status === 503) {
        setAiSetupError('Local LLM drafting is currently disabled on the server (app.llm.enabled=false).');
      } else {
        setAiSetupError(err.message || 'Failed to start AI generation.');
      }
    } finally {
      setAiSetupLoading(false);
    }
  };

  const handleCancelAiJob = async () => {
    if (!activeAiJob) return;
    setAiCancelLoading(true);
    try {
      const cancelled = await aiService.cancelJob(activeAiJob.id);
      setActiveAiJob(cancelled);
      showToast('AI generation job cancelled.');
    } catch (err) {
      setError(err.message || 'Failed to cancel generation.');
    } finally {
      setAiCancelLoading(false);
    }
  };

  const handleOpenReview = async (job) => {
    setReviewModal({ job, drafts: [], loading: true, error: '' });
    setSelectedDraftIds(new Set());
    setReviewFilter('all');
    try {
      const drafts = await aiService.getDrafts(job.id);
      setReviewModal({ job, drafts: drafts || [], loading: false, error: '' });
    } catch (err) {
      setReviewModal({ job, drafts: [], loading: false, error: err.message || 'Failed to load drafts.' });
    }
  };

  const handleApproveDraft = async (draft) => {
    try {
      await aiService.approveDraft(draft.id);
      setReviewModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (d.id === draft.id ? { ...d, status: 'APPROVED' } : d)),
        };
      });
      const updatedQuestions = await teacherService.getQuestions(subjectId);
      setQuestions(updatedQuestions);
      showToast('Question approved and added to your Question Bank!');
    } catch (err) {
      setConfirmState({
        title: 'Approval Failed',
        message: err.message || 'Failed to approve draft.',
        confirmLabel: 'Dismiss',
        isAlert: true,
        variant: 'danger',
        onConfirm: () => setConfirmState(null),
      });
    }
  };

  const handleRejectDraft = async (draft) => {
    try {
      await aiService.rejectDraft(draft.id);
      setReviewModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (d.id === draft.id ? { ...d, status: 'REJECTED' } : d)),
        };
      });
      showToast('Draft rejected.');
    } catch (err) {
      setConfirmState({
        title: 'Rejection Failed',
        message: err.message || 'Failed to reject draft.',
        confirmLabel: 'Dismiss',
        isAlert: true,
        variant: 'danger',
        onConfirm: () => setConfirmState(null),
      });
    }
  };

  const handleBulkApprove = async () => {
    if (!reviewModal?.job || selectedDraftIds.size === 0) return;
    setBulkApproveLoading(true);
    try {
      const ids = Array.from(selectedDraftIds);
      await aiService.approveSelected(reviewModal.job.id, ids);
      setReviewModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (selectedDraftIds.has(d.id) ? { ...d, status: 'APPROVED' } : d)),
        };
      });
      setSelectedDraftIds(new Set());
      const updatedQuestions = await teacherService.getQuestions(subjectId);
      setQuestions(updatedQuestions);
      showToast(`${ids.length} verified questions approved and added to bank!`);
    } catch (err) {
      setConfirmState({
        title: 'Bulk Approval Failed',
        message: err.message || 'Failed to bulk-approve drafts.',
        confirmLabel: 'Dismiss',
        isAlert: true,
        variant: 'danger',
        onConfirm: () => setConfirmState(null),
      });
    } finally {
      setBulkApproveLoading(false);
    }
  };

  const handleOpenEditDraft = (draft) => {
    setEditDraftModal({
      draft,
      questionText: draft.questionText,
      choices: [...draft.choices],
      correctIndex: draft.correctIndex,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
      loading: false,
      error: '',
    });
  };

  const handleSaveEditDraft = async (e) => {
    e.preventDefault();
    if (!editDraftModal) return;
    if (!editDraftModal.questionText.trim()) {
      setEditDraftModal((prev) => ({ ...prev, error: 'Question text is required.' }));
      return;
    }
    if (editDraftModal.choices.some((c) => !c.trim())) {
      setEditDraftModal((prev) => ({ ...prev, error: 'All 4 choices must have text.' }));
      return;
    }
    setEditDraftModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const payload = {
        questionText: editDraftModal.questionText.trim(),
        choices: editDraftModal.choices.map((c) => c.trim()),
        correctIndex: editDraftModal.correctIndex,
        explanation: editDraftModal.explanation.trim() || 'No explanation provided.',
        difficulty: editDraftModal.difficulty,
      };
      const updated = await aiService.updateDraft(editDraftModal.draft.id, payload);
      setReviewModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          drafts: prev.drafts.map((d) => (d.id === updated.id ? updated : d)),
        };
      });
      setEditDraftModal(null);
      showToast('Draft question updated.');
    } catch (err) {
      setEditDraftModal((prev) => ({ ...prev, loading: false, error: err.message || 'Failed to update draft.' }));
    }
  };

  const handleDownloadFile = async (f) => {
    try {
      await teacherService.downloadFile(f.id, f.fileName);
    } catch (err) {
      setError(err.message || 'Failed to download file.');
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
                            {q.origin === 'AI' && (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border text-ink dark:text-chalkboard-chalk flex items-center gap-1">
                                <Bot className="w-3 h-3 text-ink-blue dark:text-highlighter-sky shrink-0" />
                                AI-drafted
                              </span>
                            )}
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

            {/* TAB 4: RESOURCES (FILES & LINKS) */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                {/* Sub-tab Navigation: Files vs Links */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/15 dark:border-chalkboard-border">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResourceSubTab('files')}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border-2 transition-all cursor-pointer ${
                        resourceSubTab === 'files'
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk border-ink dark:border-chalkboard-border shadow-notebook-sm'
                          : 'bg-transparent text-ink-muted dark:text-chalkboard-muted border-transparent hover:border-ink/20'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted" />
                      <span>Document Files (PDF &amp; DOCX)</span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20">
                        {files.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceSubTab('links')}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border-2 transition-all cursor-pointer ${
                        resourceSubTab === 'links'
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk border-ink dark:border-chalkboard-border shadow-notebook-sm'
                          : 'bg-transparent text-ink-muted dark:text-chalkboard-muted border-transparent hover:border-ink/20'
                      }`}
                    >
                      <Link2 className="w-4 h-4 text-ink-muted dark:text-chalkboard-muted" />
                      <span>Web Links</span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-paper-warm dark:bg-chalkboard-surface border border-ink/20">
                        {resources.length}
                      </span>
                    </button>
                  </div>

                  {resourceSubTab === 'links' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenCreateResource}
                      className="shadow-notebook"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>New Link</span>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setUploadError('');
                        setUploadModalOpen(true);
                      }}
                      className="shadow-notebook"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      <span>Upload Document</span>
                    </Button>
                  )}
                </div>

                {/* SUBTAB CONTENT: FILES */}
                {resourceSubTab === 'files' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm/50 dark:bg-chalkboard-surface/40 flex items-start gap-3">
                      <FileUp className="w-5 h-5 text-ink-muted dark:text-chalkboard-muted shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-ink dark:text-chalkboard-chalk">
                          Document Library &amp; AI Extraction Source
                        </p>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted leading-relaxed">
                          Upload course syllabus chapters, lecture slides, or study packets (PDF and DOCX, up to 10 MB). Enrolled students download them for study. The backend extracts document text so a later phase can use it as the exclusive source for AI quiz drafting.
                        </p>
                      </div>
                    </div>

                    {files.length === 0 ? (
                      <NotebookCard className="p-8 text-center space-y-4 bg-paper-card dark:bg-chalkboard-card">
                        <div className="w-12 h-12 mx-auto rounded-full bg-paper-warm dark:bg-chalkboard-surface flex items-center justify-center border border-ink/20">
                          <FileText className="w-6 h-6 text-ink-muted dark:text-chalkboard-muted" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">No documents uploaded yet</p>
                          <p className="text-xs text-ink-muted dark:text-chalkboard-muted max-w-md mx-auto">
                            Add PDF or Word documents to share study materials with students and build your subject's knowledge source.
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setUploadError('');
                            setUploadModalOpen(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          <span>Upload First Document</span>
                        </Button>
                      </NotebookCard>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {files.map((f) => {
                          const isPdf = f.contentType?.includes('pdf') || f.fileName?.toLowerCase().endsWith('.pdf');
                          const isArchived = f.status === 'ARCHIVED';

                          return (
                            <NotebookCard
                              key={f.id}
                              pattern="ruled"
                              className={`p-5 bg-paper-card dark:bg-chalkboard-card flex flex-col justify-between space-y-3 transition-opacity ${
                                isArchived ? 'opacity-65 border-dashed' : ''
                              }`}
                            >
                              <div className="space-y-2.5">
                                {/* Header badges */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                                        isPdf
                                          ? 'bg-rose-100 dark:bg-rose-950/60 text-redpen-dark dark:text-rose-300 border-rose-300 dark:border-rose-900'
                                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-900'
                                      }`}
                                    >
                                      {isPdf ? 'PDF' : 'DOCX'}
                                    </span>
                                    {isArchived && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                                        ARCHIVED
                                      </span>
                                    )}
                                  </div>

                                  {f.topicName ? (
                                    <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted truncate max-w-[150px]">
                                      Topic: {f.topicName}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">
                                      General Study Material
                                    </span>
                                  )}
                                </div>

                                {/* Title and Filename */}
                                <div>
                                  <h3 className="font-bold text-base text-ink dark:text-chalkboard-chalk">
                                    {f.title}
                                  </h3>
                                  <p className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted mt-0.5 flex items-center gap-2">
                                    <span className="truncate max-w-[220px]" title={f.fileName}>
                                      {f.fileName}
                                    </span>
                                    <span>•</span>
                                    <span>{formatBytes(f.sizeBytes)}</span>
                                    {f.pageCount != null && (
                                      <>
                                        <span>•</span>
                                        <span>{f.pageCount} pg{f.pageCount === 1 ? '' : 's'}</span>
                                      </>
                                    )}
                                  </p>
                                  {f.description && (
                                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-1 line-clamp-2">
                                      {f.description}
                                    </p>
                                  )}
                                </div>

                                {/* Extraction Status Chip (Text label + icon) */}
                                <div className="pt-1">
                                  {f.extractionStatus === 'READY' && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span className="font-bold text-emerald-900 dark:text-emerald-200">Text ready</span>
                                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                                        ({f.extractedCharCount.toLocaleString()} chars)
                                      </span>
                                    </div>
                                  )}
                                  {f.extractionStatus === 'EMPTY' && (
                                    <div
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs"
                                      title={f.extractionNote || 'Scanned or image-only documents contain no readable text'}
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                      <span className="font-bold text-amber-900 dark:text-amber-200">No readable text</span>
                                      <span className="text-[10px] text-amber-700 dark:text-amber-400">
                                        (scanned or image-only)
                                      </span>
                                    </div>
                                  )}
                                  {f.extractionStatus === 'FAILED' && (
                                    <div
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-redpen-soft dark:bg-rose-950/40 border border-redpen/40 text-xs"
                                      title={f.extractionNote || 'Unable to parse document'}
                                    >
                                      <X className="w-3.5 h-3.5 text-redpen shrink-0" />
                                      <span className="font-bold text-redpen-dark dark:text-rose-200">Couldn't read this file</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Buttons */}
                              <div className="pt-2 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTextPreview(f)}
                                    className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk hover:underline flex items-center gap-1 cursor-pointer"
                                    title="Inspect extracted text for AI drafting"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview Text</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenAiSetup(f)}
                                    disabled={f.extractionStatus !== 'READY'}
                                    className={`text-xs font-mono font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all ${
                                      f.extractionStatus === 'READY'
                                        ? 'border-ink dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink dark:text-chalkboard-chalk shadow-notebook-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ink dark:focus-visible:ring-chalkboard-chalk'
                                        : 'opacity-40 cursor-not-allowed bg-ink/5 dark:bg-chalkboard-surface/40 border-ink/20 dark:border-chalkboard-borderSubtle text-ink-muted dark:text-chalkboard-muted'
                                    }`}
                                    title={
                                      f.extractionStatus === 'READY'
                                        ? 'Draft multiple-choice questions from this document using local AI'
                                        : 'Text extraction must be ready before drafting questions'
                                    }
                                  >
                                    <Bot className="w-3.5 h-3.5 text-ink-blue dark:text-highlighter-sky" />
                                    <span>Draft with AI</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(f)}
                                    className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                                    title="Download original file"
                                    aria-label={`Download ${f.fileName}`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditFile(f)}
                                    className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink cursor-pointer"
                                    title="Edit file details"
                                    aria-label={`Edit ${f.title}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArchiveFile(f)}
                                    className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-amber-600 cursor-pointer"
                                    title={isArchived ? 'Restore file' : 'Archive file'}
                                    aria-label={`${isArchived ? 'Restore' : 'Archive'} ${f.title}`}
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteFile(f)}
                                    className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-redpen cursor-pointer"
                                    title="Delete file permanently"
                                    aria-label={`Delete ${f.title}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </NotebookCard>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB CONTENT: LINKS */}
                {resourceSubTab === 'links' && (
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

        {/* ================================================================= */}
        {/* MODAL: UPLOAD FILE & EXTRACT TEXT (PHASE B) */}
        {/* ================================================================= */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Upload Course Document
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    PDF or Word (.docx) documents up to 10 MB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploadLoading) {
                      setUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadError('');
                    }
                  }}
                  disabled={uploadLoading}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink cursor-pointer"
                  aria-label="Close upload dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft dark:bg-rose-950/40 text-redpen-dark dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-redpen" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Drag and drop / file selector */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Select Document <span className="text-redpen">*</span>
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('hidden-file-input')?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectUploadFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('hidden-file-input')?.click()}
                    className={`p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-redpen ${
                      isDragging
                        ? 'border-redpen bg-redpen-soft/30 dark:bg-rose-950/20'
                        : uploadFile
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-ink/30 dark:border-chalkboard-border bg-paper-warm/30 dark:bg-chalkboard-surface/30 hover:border-ink/60'
                    }`}
                  >
                    <input
                      id="hidden-file-input"
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSelectUploadFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {uploadFile ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span className="truncate max-w-[280px]">{uploadFile.name}</span>
                        </div>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted font-mono">
                          {formatBytes(uploadFile.size)} • Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-8 h-8 mx-auto text-ink-muted dark:text-chalkboard-muted" />
                        <p className="text-sm font-bold text-ink dark:text-chalkboard-chalk">
                          Drop PDF or Word document here, or click to browse
                        </p>
                        <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                          Allowed: PDF (.pdf), Word (.docx) • Max size: 10 MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Document Title <span className="text-redpen">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Chapter 4: Loops & Control Flow"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief summary of concepts covered in this document…"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                  />
                </div>

                {/* Topic Tag */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Curriculum Topic (Optional)
                  </label>
                  <select
                    value={uploadTopicId}
                    onChange={(e) => setUploadTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                  >
                    <option value="">General Study Material (Untagged)</option>
                    {topics
                      .filter((t) => t.status === 'ACTIVE')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Topic: {t.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-ink-muted dark:text-chalkboard-muted mt-1">
                    Topic-tagged files join student recommendation cards when a gap is diagnosed; untagged files appear in class study materials.
                  </p>
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadError('');
                    }}
                    disabled={uploadLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={uploadLoading || !uploadFile}
                    className="shadow-notebook"
                  >
                    {uploadLoading ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                        <span>Uploading &amp; Extracting…</span>
                      </span>
                    ) : (
                      'Upload & Extract'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: PREVIEW EXTRACTED TEXT (PHASE B) */}
        {/* ================================================================= */}
        {previewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Extracted Document Text Preview
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Source file: <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk">{previewModal.file?.fileName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink cursor-pointer"
                  aria-label="Close preview dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informational Callout regarding AI drafting */}
              <div className="p-3.5 rounded-xl border border-ink/15 dark:border-chalkboard-border bg-paper-warm/70 dark:bg-chalkboard-surface/60 text-ink dark:text-chalkboard-chalk text-xs flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-ink-blue dark:text-highlighter-sky shrink-0 mt-0.5" />
                <p className="leading-relaxed text-ink-muted dark:text-chalkboard-muted">
                  This extracted text is private to you and the system. In a later phase, this content will serve as the <strong>exclusive factual source</strong> for automated AI quiz drafting, ensuring questions are strictly grounded in your provided materials.
                </p>
              </div>

              {previewModal.loading ? (
                <div className="py-12 text-center text-xs text-ink-muted dark:text-chalkboard-muted flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" />
                  <span>Loading extracted text…</span>
                </div>
              ) : previewModal.error ? (
                <div className="p-4 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{previewModal.error}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-muted dark:text-chalkboard-muted">
                    <span>Status: <strong className="text-ink dark:text-chalkboard-chalk">{previewModal.data?.extractionStatus}</strong></span>
                    <span>Total characters extracted: <strong className="text-ink dark:text-chalkboard-chalk">{previewModal.data?.totalCharCount?.toLocaleString() || 0}</strong></span>
                    <span>Showing first 3,000 characters</span>
                  </div>

                  {previewModal.data?.previewText ? (
                    <div className="max-h-96 overflow-y-auto p-4 rounded-xl border border-ink/20 dark:border-chalkboard-border bg-paper-warm/40 dark:bg-chalkboard-surface/40 font-mono text-xs text-ink dark:text-chalkboard-chalk whitespace-pre-wrap select-text leading-relaxed">
                      {previewModal.data.previewText}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-dashed border-ink/30 dark:border-chalkboard-border text-xs text-ink-muted dark:text-chalkboard-muted space-y-1">
                      <p className="font-bold">No readable text found</p>
                      <p>{previewModal.data?.extractionNote || 'This document contains no parseable text (for example a scanned image-only PDF).'}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-ink/10 flex items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setPreviewModal(null)}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: EDIT FILE DETAILS (PHASE B) */}
        {/* ================================================================= */}
        {editFileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Edit Document Details
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    File: <span className="font-mono">{editFileModal.file.fileName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFileModal(null)}
                  disabled={editFileModal.loading}
                  className="p-1 rounded-lg hover:bg-paper-warm text-ink-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editFileModal.error && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-redpen" />
                  <span>{editFileModal.error}</span>
                </div>
              )}

              <form onSubmit={handleEditFileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Document Title <span className="text-redpen">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editFileModal.title}
                    onChange={(e) => setEditFileModal((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-redpen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={editFileModal.description}
                    onChange={(e) => setEditFileModal((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-redpen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Curriculum Topic (Optional)
                  </label>
                  <select
                    value={editFileModal.topicId}
                    onChange={(e) => setEditFileModal((prev) => ({ ...prev, topicId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                  >
                    <option value="">General Study Material (Untagged)</option>
                    {topics
                      .filter((t) => t.status === 'ACTIVE')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Topic: {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setEditFileModal(null)}
                    disabled={editFileModal.loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={editFileModal.loading}
                    className="shadow-notebook"
                  >
                    {editFileModal.loading ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* ================================================================= */}
        {/* MODAL: AI QUESTION DRAFTING SETUP (PHASE C) */}
        {/* ================================================================= */}
        {aiSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-5 my-8">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Draft Questions with Local AI
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted mt-1">
                    Source: <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk">{aiSetupModal.file?.title}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSetupModal(null)}
                  disabled={aiSetupLoading}
                  className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-chalkboard-chalk"
                  aria-label="Close setup dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Local AI Architecture & Privacy Callout */}
              <div className="p-3.5 rounded-xl border border-ink/15 dark:border-chalkboard-border bg-paper-warm/70 dark:bg-chalkboard-surface/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-ink dark:text-chalkboard-chalk">
                    <Bot className="w-4 h-4 text-ink-blue dark:text-highlighter-sky shrink-0" />
                    <span>Model: {aiStatus.model || 'qwen/qwen3-14b'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-chalkboard-border text-ink-muted dark:text-chalkboard-muted">
                    Local Offline
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-ink-muted dark:text-chalkboard-muted">
                  Served locally via LM Studio. Your document text never leaves your local machine. Every generated question will be held as a draft for your review and approval before students can see it.
                </p>
              </div>

              {aiSetupError && (
                <div className="p-3 rounded-xl border-2 border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-redpen" />
                  <span className="font-medium">{aiSetupError}</span>
                </div>
              )}

              <form onSubmit={handleStartAiGeneration} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1.5">
                    Target Curriculum Topic <span className="text-redpen">*</span>
                  </label>
                  <select
                    required
                    value={aiTopicId}
                    onChange={(e) => setAiTopicId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono focus:outline-none focus:border-ink dark:focus:border-chalkboard-chalk focus:ring-1 focus:ring-ink"
                  >
                    <option value="">Select Topic</option>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                      Number of Questions to Draft: <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk px-1.5 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border ml-1">{aiQuestionCount}</span>
                    </label>
                    <span className="text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted">1 to 30</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full accent-ink dark:accent-chalkboard-chalk cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-ink-muted dark:text-chalkboard-muted mt-1">
                    <span>5</span>
                    <span>10 (Default)</span>
                    <span>20</span>
                    <span>30</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-ink/10 dark:border-chalkboard-borderSubtle flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setAiSetupModal(null)}
                    disabled={aiSetupLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={aiSetupLoading}
                  >
                    {aiSetupLoading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Starting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-4 h-4" />
                        <span>Draft Questions</span>
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: ACTIVE AI GENERATION PROGRESS */}
        {/* ================================================================= */}
        {activeAiJob && ['QUEUED', 'RUNNING'].includes(activeAiJob.status) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 text-ink-blue dark:text-highlighter-sky animate-spin" />
                  <div>
                    <h3 className="text-base font-bold text-ink dark:text-chalkboard-chalk">
                      {activeAiJob.status === 'QUEUED' ? 'Job Queued...' : 'Drafting Questions...'}
                    </h3>
                    <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                      Analyzing document text with local model
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink dark:text-chalkboard-chalk">
                    Section {activeAiJob.sectionsDone} of {activeAiJob.sectionsTotal || 1}
                  </span>
                  <span className="font-mono font-bold text-ink dark:text-chalkboard-chalk">
                    {activeAiJob.sectionsTotal > 0
                      ? Math.round((activeAiJob.sectionsDone / activeAiJob.sectionsTotal) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-paper-warm dark:bg-chalkboard-surface overflow-hidden border border-ink/20 dark:border-chalkboard-border">
                  <div
                    className="h-full bg-ink dark:bg-chalkboard-chalk transition-all duration-300"
                    style={{
                      width: `${
                        activeAiJob.sectionsTotal > 0
                          ? Math.round((activeAiJob.sectionsDone / activeAiJob.sectionsTotal) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/15 dark:border-chalkboard-border text-xs font-mono flex items-center justify-between">
                <span className="text-ink-muted dark:text-chalkboard-muted">Drafts produced so far:</span>
                <span className="font-bold text-ink dark:text-chalkboard-chalk">{activeAiJob.draftsCount || 0}</span>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelAiJob}
                  disabled={aiCancelLoading}
                  className="text-redpen border-redpen/40 hover:bg-redpen-soft dark:hover:bg-rose-950/20"
                >
                  {aiCancelLoading ? 'Cancelling...' : 'Cancel Generation'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: AI QUESTION REVIEW SCREEN */}
        {/* ================================================================= */}
        {reviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-4xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-5 my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-ink/10 dark:border-chalkboard-borderSubtle pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 dark:border-chalkboard-border text-ink dark:text-chalkboard-chalk text-xs font-mono font-bold flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-ink-blue dark:text-highlighter-sky shrink-0" />
                      AI Question Review
                    </span>
                    <span className="text-xs font-mono text-ink-muted">
                      Job #{reviewModal.job.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-ink dark:text-chalkboard-chalk mt-1">
                    Review AI Drafted Questions
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="p-1 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted hover:text-ink cursor-pointer"
                  aria-label="Close review"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Permanent Model Banner */}
              <div className="p-3.5 rounded-xl border border-ink/15 dark:border-chalkboard-border bg-paper-warm/70 dark:bg-chalkboard-surface/60 text-ink dark:text-chalkboard-chalk text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-ink-blue dark:text-highlighter-sky shrink-0" />
                  <span>
                    Drafted by <strong>{reviewModal.job.modelName || 'qwen/qwen3-14b'}</strong>. Review every question before approving. Nothing reaches students until approved.
                  </span>
                </div>
                <div className="shrink-0 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-paper-card dark:bg-chalkboard-card border border-ink/20 dark:border-chalkboard-border text-ink-muted dark:text-chalkboard-muted">
                  Human In The Loop
                </div>
              </div>

              {/* Filter Tabs & Bulk Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-paper-warm dark:bg-chalkboard-surface border border-ink/10 text-xs font-mono">
                  {[
                    { key: 'all', label: `All (${reviewModal.drafts.length})` },
                    {
                      key: 'verified',
                      label: `Verified (${reviewModal.drafts.filter((d) => d.evidenceVerified).length})`,
                    },
                    {
                      key: 'unverified',
                      label: `Unverified (${reviewModal.drafts.filter((d) => !d.evidenceVerified).length})`,
                    },
                    {
                      key: 'approved',
                      label: `Approved (${reviewModal.drafts.filter((d) => d.status === 'APPROVED').length})`,
                    },
                    {
                      key: 'rejected',
                      label: `Rejected (${reviewModal.drafts.filter((d) => d.status === 'REJECTED').length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setReviewFilter(tab.key)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        reviewFilter === tab.key
                          ? 'bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk font-bold shadow-xs'
                          : 'text-ink-muted hover:text-ink dark:text-chalkboard-muted'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const verifiedIds = reviewModal.drafts
                        .filter((d) => d.evidenceVerified && d.status === 'PENDING')
                        .map((d) => d.id);
                      setSelectedDraftIds(new Set(verifiedIds));
                    }}
                    className="text-xs font-mono font-bold text-ink-blue dark:text-highlighter-sky hover:underline cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                  >
                    Select All Verified Pending
                  </button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={
                      bulkApproveLoading ||
                      selectedDraftIds.size === 0 ||
                      Array.from(selectedDraftIds).some(
                        (id) => !reviewModal.drafts.find((d) => d.id === id)?.evidenceVerified
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-notebook"
                    title={
                      Array.from(selectedDraftIds).some(
                        (id) => !reviewModal.drafts.find((d) => d.id === id)?.evidenceVerified
                      )
                        ? 'Unverified drafts cannot be bulk-approved. Review each individually.'
                        : ''
                    }
                  >
                    {bulkApproveLoading ? (
                      'Approving...'
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Approve Selected ({selectedDraftIds.size})</span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Draft Cards Scrollable Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {reviewModal.loading ? (
                  <div className="py-12 text-center text-xs text-ink-muted dark:text-chalkboard-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading drafts...</span>
                  </div>
                ) : reviewModal.drafts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-muted">
                    No drafts found for this job.
                  </div>
                ) : (
                  reviewModal.drafts
                    .filter((d) => {
                      if (reviewFilter === 'verified') return d.evidenceVerified;
                      if (reviewFilter === 'unverified') return !d.evidenceVerified;
                      if (reviewFilter === 'approved') return d.status === 'APPROVED';
                      if (reviewFilter === 'rejected') return d.status === 'REJECTED';
                      return true;
                    })
                    .map((d, index) => {
                      const isSelected = selectedDraftIds.has(d.id);
                      return (
                        <div
                          key={d.id}
                          className={`p-4 rounded-xl border-2 transition-all space-y-3 ${
                            d.status === 'APPROVED'
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                              : d.status === 'REJECTED'
                              ? 'bg-ink/5 dark:bg-chalkboard-surface border-ink/20 opacity-60'
                              : 'bg-paper-warm/50 dark:bg-chalkboard-surface border-ink/20'
                          }`}
                        >
                          {/* Top Row: Select Checkbox, Number, Status, Difficulty, Evidence Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-2.5">
                            <div className="flex items-center gap-2">
                              {d.status === 'PENDING' && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedDraftIds);
                                    if (e.target.checked) next.add(d.id);
                                    else next.delete(d.id);
                                    setSelectedDraftIds(next);
                                  }}
                                  className="rounded border-ink/40 text-ink focus:ring-ink dark:border-chalkboard-border dark:bg-chalkboard-surface cursor-pointer"
                                />
                              )}
                              <span className="text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
                                Draft #{index + 1}
                              </span>
                              <span className="text-[10px] font-mono text-ink-muted">
                                Section {d.sectionIndex + 1}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                  d.difficulty === 'EASY'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : d.difficulty === 'HARD'
                                    ? 'bg-red-100 text-red-900 border border-red-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {d.difficulty}
                              </span>
                              {d.status === 'APPROVED' && (
                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 border border-emerald-400">
                                  Approved
                                </span>
                              )}
                              {d.status === 'REJECTED' && (
                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-ink/10 text-ink-muted border border-ink/20">
                                  Rejected
                                </span>
                              )}
                            </div>

                            {/* Evidence Quote Badge */}
                            <div>
                              {d.evidenceVerified ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[10px] font-mono text-emerald-900 dark:text-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Quote found in file</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[10px] font-mono text-amber-900 dark:text-amber-200" title="The model cited a quote that was not found verbatim in this section text. Review carefully before approving.">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Quote not found: check carefully</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Question Text */}
                          <div>
                            <p className="text-sm font-semibold text-ink dark:text-chalkboard-chalk">
                              {d.questionText}
                            </p>
                          </div>

                          {/* 4 Choices */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {d.choices.map((choice, cIdx) => {
                              const isCorrect = cIdx === d.correctIndex;
                              const label = ['A', 'B', 'C', 'D'][cIdx];
                              return (
                                <div
                                  key={cIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 font-semibold'
                                      : 'bg-paper-card dark:bg-chalkboard-card border-ink/20 text-ink dark:text-chalkboard-chalk'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-paper-warm dark:bg-chalkboard-surface border border-ink/20 text-ink-muted'
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  <span className="flex-1 break-words">{choice}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          <div className="p-2.5 rounded-xl bg-paper-card dark:bg-chalkboard-card border border-ink/10 text-xs text-ink-muted dark:text-chalkboard-muted">
                            <span className="font-bold text-ink dark:text-chalkboard-chalk">Explanation: </span>
                            <span>{d.explanation}</span>
                          </div>

                          {/* Cited Evidence Quote Text */}
                          {d.evidenceQuote && (
                            <div className="text-xs font-mono text-ink-muted dark:text-chalkboard-muted italic pl-3 border-l-2 border-redpen-margin dark:border-redpen/60">
                              <span className="font-bold not-italic">Cited evidence: </span>
                              "{d.evidenceQuote}"
                            </div>
                          )}

                          {/* Actions */}
                          <div className="pt-2 flex items-center justify-between border-t border-ink/10">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDraft(d)}
                              className="text-xs font-mono text-ink dark:text-chalkboard-chalk hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Draft</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {d.status !== 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() => handleRejectDraft(d)}
                                  className="px-2.5 py-1 rounded-lg border border-redpen/40 text-redpen hover:bg-redpen-soft text-xs font-mono cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}
                              {d.status !== 'APPROVED' && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveDraft(d)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-notebook"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  <span>Approve Question</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-ink/10 flex items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setReviewModal(null)}
                >
                  Close Review
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL: EDIT AI QUESTION DRAFT */}
        {/* ================================================================= */}
        {editDraftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-paper-card dark:bg-chalkboard-card border-2 border-ink dark:border-chalkboard-border p-6 shadow-notebook-lg space-y-4 my-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink dark:text-chalkboard-chalk">
                    Edit AI Drafted Question
                  </h3>
                  <p className="text-xs text-ink-muted dark:text-chalkboard-muted">
                    Refine text, choices, and explanation before publishing to Question Bank.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditDraftModal(null)}
                  disabled={editDraftModal.loading}
                  className="p-1.5 rounded-lg hover:bg-paper-warm dark:hover:bg-chalkboard-surface text-ink-muted dark:text-chalkboard-muted hover:text-ink dark:hover:text-chalkboard-chalk transition-colors cursor-pointer"
                  aria-label="Close edit draft dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editDraftModal.error && (
                <div className="p-3 rounded-xl border border-redpen bg-redpen-soft text-redpen-dark text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-redpen" />
                  <span>{editDraftModal.error}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditDraft} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Question Text <span className="text-redpen">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editDraftModal.questionText}
                    onChange={(e) => setEditDraftModal((prev) => ({ ...prev, questionText: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-sm focus:outline-none focus:border-ink dark:focus:border-chalkboard-chalk focus:ring-1 focus:ring-ink"
                  />
                </div>

                {/* 4 Choices with correct answer selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk">
                    Choices (Select the correct answer) <span className="text-redpen">*</span>
                  </label>
                  {editDraftModal.choices.map((cText, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="correctChoice"
                        checked={editDraftModal.correctIndex === idx}
                        onChange={() => setEditDraftModal((prev) => ({ ...prev, correctIndex: idx }))}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="w-6 text-center text-xs font-mono font-bold text-ink dark:text-chalkboard-chalk">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <input
                        type="text"
                        required
                        value={cText}
                        onChange={(e) => {
                          const next = [...editDraftModal.choices];
                          next[idx] = e.target.value;
                          setEditDraftModal((prev) => ({ ...prev, choices: next }));
                        }}
                        placeholder={`Option ${['A', 'B', 'C', 'D'][idx]}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-ink dark:focus:border-chalkboard-chalk focus:ring-1 focus:ring-ink"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={editDraftModal.difficulty}
                      onChange={(e) => setEditDraftModal((prev) => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-border bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs font-mono"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink dark:text-chalkboard-chalk mb-1">
                    Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={editDraftModal.explanation}
                    onChange={(e) => setEditDraftModal((prev) => ({ ...prev, explanation: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/30 dark:border-chalkboard-borderSubtle bg-paper-card dark:bg-chalkboard-card text-ink dark:text-chalkboard-chalk text-xs focus:outline-none focus:border-ink dark:focus:border-chalkboard-chalk focus:ring-1 focus:ring-ink"
                  />
                </div>

                <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setEditDraftModal(null)}
                    disabled={editDraftModal.loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={editDraftModal.loading}
                  >
                    {editDraftModal.loading ? 'Saving…' : 'Save Draft'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ================================================================= */}
        {/* SHARED CONFIRMATION & ALERT MODAL */}
        {/* ================================================================= */}
        <ConfirmModal
          isOpen={Boolean(confirmState)}
          title={confirmState?.title || ''}
          message={confirmState?.message || ''}
          confirmLabel={confirmState?.confirmLabel || 'Confirm'}
          cancelLabel={confirmState?.cancelLabel || 'Cancel'}
          variant={confirmState?.variant || 'primary'}
          loading={Boolean(confirmState?.loading)}
          loadingLabel={confirmState?.loadingLabel || 'Processing…'}
          isAlert={Boolean(confirmState?.isAlert)}
          onConfirm={handleConfirmAction}
          onCancel={() => {
            if (!confirmState?.loading) {
              setConfirmState(null);
            }
          }}
        />
      </div>
    </PortalShell>
  );
}
