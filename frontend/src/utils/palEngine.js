export const PAL_STYLES = [
  { id: 'sticky', label: 'Sticky-Note', hint: 'Paper spirit' },
  { id: 'owl', label: 'Doodle Owl', hint: 'Study owl' },
  { id: 'cat', label: 'Doodle Cat', hint: 'Desk cat' },
  { id: 'shiba', label: 'Doodle Shiba', hint: 'Shiba pup' },
];

export const PAL_COLORS = [
  { id: 'yellow', label: 'Sunbeam Yellow', fill: '#FDE047', soft: '#FEF9C3' },
  { id: 'mint', label: 'Fresh Mint', fill: '#86EFAC', soft: '#DCFCE7' },
  { id: 'pink', label: 'Berry Pink', fill: '#F9A8D4', soft: '#FCE7F3' },
  { id: 'sky', label: 'Sky Blue', fill: '#93C5FD', soft: '#DBEAFE' },
];

export const PAL_PRESET_NAMES = ['Pip', 'Inky', 'Mochi', 'Scribble'];

export function getPalProfile(user) {
  return {
    name: user?.palName?.trim() || 'Pip',
    style: PAL_STYLES.some((s) => s.id === user?.palStyle) ? user.palStyle : 'sticky',
    color: PAL_COLORS.some((c) => c.id === user?.palColor) ? user.palColor : 'yellow',
    enabled: user?.palEnabled !== false,
    quietInQuiz: user?.palQuietInQuiz !== false,
  };
}

function firstName(fullName) {
  if (!fullName || !fullName.trim()) return 'there';
  return fullName.trim().split(/\s+/)[0];
}

function isGapStatus(status) {
  return status === 'GAP' || status === 'PRIORITY_GAP' || status === 'WEAK';
}

function isStrengthStatus(status) {
  return status === 'STRENGTH' || status === 'MASTERED';
}

/**
 * Computes Pal mood and margin-note copy from diagnostic progress data.
 * scope: 'global' (across all classes) | 'class' (inside one class workspace).
 */
export function evaluateProgressPal(progress, { scope = 'class', studentName = '', palName = 'Pip' } = {}) {
  const name = firstName(studentName);
  const topics = Array.isArray(progress?.topics) ? progress.topics : [];
  const evaluated = topics.filter((t) => t.status !== 'INSUFFICIENT_DATA' || (t.questionsAnswered ?? 0) > 0);

  if (evaluated.length === 0) {
    return {
      mood: 'fresh',
      statusLabel: 'Ready to Start',
      headline: scope === 'global' ? `Welcome, ${name}!` : `Blank notebook, ${name}!`,
      message:
        scope === 'global'
          ? `I'm ${palName}, your study pal. Open a class and take your first quiz so I can map what we know and where to focus.`
          : `Take your first quiz in this class so ${palName} can spot your strengths and any foggy topics.`,
      focusTopic: null,
    };
  }

  const gapTopics = evaluated.filter((t) => isGapStatus(t.status));
  const strengthTopics = evaluated.filter((t) => isStrengthStatus(t.status));
  const focusTopic = progress?.studyNext || gapTopics[0] || evaluated[0];
  const focusName = focusTopic?.topicName || 'your next topic';

  // Global hub uses balanced mixed-status rule: strengths + gaps => Focused (not punishing Foggy)
  if (scope === 'global' && gapTopics.length > 0 && strengthTopics.length > 0) {
    const strongest = strengthTopics[0]?.topicName;
    return {
      mood: 'focused',
      statusLabel: `${strengthTopics.length} Mastered · ${gapTopics.length} Gap${gapTopics.length > 1 ? 's' : ''}`,
      headline: `Welcome back, ${name}!`,
      message: strongest
        ? `We're already strong in ${strongest} — ready to put on the study glasses and clear ${focusName} next?`
        : `Good to see you! Ready to build on your strengths and clear ${focusName} next?`,
      focusTopic,
    };
  }

  if (gapTopics.length > 0) {
    const remaining = Math.max(
      0,
      (focusTopic?.resourcesRecommended ?? 0) - (focusTopic?.resourcesCompleted ?? 0)
    );
    return {
      mood: 'foggy',
      statusLabel: `${gapTopics.length} Gap${gapTopics.length > 1 ? 's' : ''} Detected`,
      headline: scope === 'global' ? `Welcome back, ${name}!` : `${focusName} is still a little foggy`,
      message:
        remaining > 0
          ? `${palName} spotted ${remaining} recommended resource${remaining > 1 ? 's' : ''} for ${focusName}. Let's review together and clear it up.`
          : `Our diagnostic flagged ${focusName} as a priority gap. A quick review before your next retake will turn this around.`,
      focusTopic,
    };
  }

  if (strengthTopics.length === evaluated.length) {
    return {
      mood: 'thriving',
      statusLabel: 'All Topics Strong',
      headline: scope === 'global' ? `Welcome back, ${name}!` : `Sharp notes, ${name}!`,
      message:
        scope === 'global'
          ? `Every evaluated topic across your classes is at mastery level. Keep the streak going!`
          : `Every evaluated topic in this class is mastered. You're ready for whatever comes next.`,
      focusTopic: null,
    };
  }

  // Developing / ON_TRACK
  const remaining = Math.max(
    0,
    (focusTopic?.resourcesRecommended ?? 0) - (focusTopic?.resourcesCompleted ?? 0)
  );
  return {
    mood: 'focused',
    statusLabel: 'On Track',
    headline: scope === 'global' ? `Welcome back, ${name}!` : `Steady progress on ${focusName}`,
    message:
      remaining > 0
        ? `No critical gaps right now. Knock out ${remaining} more study resource${remaining > 1 ? 's' : ''} on ${focusName} to push it to mastery.`
        : `You're on track across this notebook. One more focused practice round will lock in ${focusName}.`,
    focusTopic,
  };
}

/**
 * Computes Pal mood and reaction copy for a submitted assessment attempt.
 */
export function evaluateAttemptPal(result, { studentName = '', palName = 'Pip' } = {}) {
  const name = firstName(studentName);
  if (!result) {
    return {
      mood: 'fresh',
      statusLabel: 'Submitted',
      headline: `Nice work finishing, ${name}.`,
      message: `${palName} is checking your answers.`,
      weakTopic: null,
    };
  }

  if (result.awaitingTeacherGrading) {
    const count = result.ungradedEssayCount ?? 1;
    return {
      mood: 'waiting',
      statusLabel: 'Awaiting Review',
      headline: 'Taking a quick breather while your teacher grades',
      message: `${count} written answer${count > 1 ? 's are' : ' is'} waiting for teacher review. Your final score and topic mastery will update as soon as grading finishes.`,
      weakTopic: null,
    };
  }

  const pct = Number(result.percentage ?? 0);
  const breakdowns = Array.isArray(result.topicBreakdowns) ? result.topicBreakdowns : [];
  const weakest = [...breakdowns].sort((a, b) => (a.percentage ?? 100) - (b.percentage ?? 100))[0] || null;
  const hasWeakTopic = weakest && (weakest.percentage ?? 100) < 70;

  if (pct >= 80 && !hasWeakTopic) {
    return {
      mood: 'thriving',
      statusLabel: `${Math.round(pct)}% Mastery`,
      headline: `Clean work, ${name}!`,
      message: `${palName} is thrilled — you hit ${Math.round(pct)}% on ${result.assessmentTitle || 'this assessment'}. Your notes are paying off.`,
      weakTopic: null,
    };
  }

  if (pct < 60 || (weakest && (weakest.percentage ?? 100) < 60)) {
    const topicLabel = weakest?.topicName || 'a few tricky concepts';
    return {
      mood: 'foggy',
      statusLabel: 'Focus Needed',
      headline: `${topicLabel} got us this time`,
      message: `No stress — ${palName} marked ${topicLabel} so you don't have to re-study everything. Review that topic's materials and we'll clear the fog.`,
      weakTopic: weakest,
    };
  }

  const topicLabel = weakest?.topicName;
  return {
    mood: 'focused',
    statusLabel: `${Math.round(pct)}% On Track`,
    headline: 'Getting sharper every attempt',
    message: topicLabel
      ? `Solid ${Math.round(pct)}% score! Polishing ${topicLabel} next will push this into mastery territory.`
      : `Solid ${Math.round(pct)}% score! A quick review of the missed questions will lock this in.`,
    weakTopic: hasWeakTopic ? weakest : null,
  };
}

/**
 * Builds concise factual summary stats for "Pal's Study Diary" on StudentProgress.
 */
export function buildPalDiary(progress, { palName = 'Pip' } = {}) {
  const topics = Array.isArray(progress?.topics) ? progress.topics : [];
  const evaluated = topics.filter((t) => t.status !== 'INSUFFICIENT_DATA' || (t.questionsAnswered ?? 0) > 0);
  const masteredCount = evaluated.filter((t) => isStrengthStatus(t.status)).length;
  const gapCount = evaluated.filter((t) => isGapStatus(t.status)).length;
  const resourcesDone = topics.reduce((sum, t) => sum + (t.resourcesCompleted ?? 0), 0);
  const nextTopic = progress?.studyNext?.topicName || null;

  return {
    title: `${palName}'s Study Diary`,
    evaluatedCount: evaluated.length,
    masteredCount,
    gapCount,
    resourcesDone,
    nextTopic,
  };
}
