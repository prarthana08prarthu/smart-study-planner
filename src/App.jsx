import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const DEFAULT_SUBJECTS = [
  {
    id: 1,
    name: "Data Structures",
    examDate: "2026-10-10",
    difficulty: "Medium",
    topics: [
      "Arrays",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Trees",
      "Graphs",
      "Searching",
      "Sorting",
    ],
  },
  {
    id: 2,
    name: "Computer Organization",
    examDate: "2026-10-08",
    difficulty: "Hard",
    topics: [
      "Functional Units",
      "Memory Locations",
      "Instruction Formats",
      "Addressing Modes",
      "Signed Numbers",
      "Multiplication",
      "Division",
      "Floating Point",
      "Cache",
      "Performance",
    ],
  },
  {
    id: 3,
    name: "Database Management",
    examDate: "2026-10-12",
    difficulty: "Easy",
    topics: [
      "DBMS Basics",
      "ER Model",
      "EER Model",
      "SQL DDL",
      "SQL DML",
      "Constraints",
    ],
  },
];

const STORAGE_KEYS = {
  subjects: "smartPlanner_subjects",
  studyHours: "smartPlanner_studyHours",
  completedTopics: "smartPlanner_completedTopics",
  completedSessions: "smartPlanner_completedSessions",
  studiedSeconds: "smartPlanner_studiedSeconds",
  studyDates: "smartPlanner_studyDates",
  subjectStudiedSeconds: "smartPlanner_subjectStudiedSeconds",
};

const getDifficultyScore = (difficulty) => {
  const value = String(difficulty).toLowerCase();

  if (value === "hard" || value === "1") return 25;
  if (value === "medium" || value === "0.65") return 16;
  if (value === "easy" || value === "0.35") return 9;

  return 16;
};

const getDifficultyLabel = (difficulty) => {
  const value = String(difficulty).toLowerCase();

  if (value === "hard" || value === "1") return "Hard";
  if (value === "medium" || value === "0.65") return "Medium";
  if (value === "easy" || value === "0.35") return "Easy";

  return "Medium";
};

const normalizeDifficulty = (difficulty) => {
  if (
    difficulty === "Hard" ||
    difficulty === 1 ||
    difficulty === "1"
  ) {
    return "Hard";
  }

  if (
    difficulty === "Medium" ||
    difficulty === 0.65 ||
    difficulty === "0.65"
  ) {
    return "Medium";
  }

  if (
    difficulty === "Easy" ||
    difficulty === 0.35 ||
    difficulty === "0.35"
  ) {
    return "Easy";
  }

  return "Medium";
};

const normalizeSubject = (subject) => ({
  ...subject,
  difficulty: normalizeDifficulty(subject.difficulty),
  topics: Array.isArray(subject.topics) ? subject.topics : [],
});

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

const formatStudyDuration = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  if (safeSeconds < 60) {
    return `${safeSeconds} sec`;
  }

  const minutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  }

  return `${minutes} min`;
};

const calculateDaysRemaining = (examDate) => {
  const today = new Date();
  const exam = new Date(`${examDate}T23:59:59`);

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const examStart = new Date(
    exam.getFullYear(),
    exam.getMonth(),
    exam.getDate(),
  );

  const difference = examStart - todayStart;

  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
};

const getUrgencyScore = (daysRemaining) => {
  if (daysRemaining <= 0) return 55;
  if (daysRemaining === 1) return 48;
  if (daysRemaining === 2) return 44;
  if (daysRemaining === 3) return 39;
  if (daysRemaining === 4) return 34;
  if (daysRemaining === 5) return 29;
  if (daysRemaining <= 7) return 24;
  if (daysRemaining <= 10) return 18;
  if (daysRemaining <= 14) return 12;

  return 6;
};

const getScoreLabel = (score) => {
  if (score >= 90) return "Critical priority";
  if (score >= 75) return "High priority";
  if (score >= 60) return "Medium priority";

  return "Normal priority";
};

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

function App() {
  const [subjects, setSubjects] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.subjects);

      if (!stored) {
        return DEFAULT_SUBJECTS;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return DEFAULT_SUBJECTS;
      }

      return parsed.map(normalizeSubject);
    } catch {
      return DEFAULT_SUBJECTS;
    }
  });

  const [studyHours, setStudyHours] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.studyHours);
      return stored ? Number(stored) : 3;
    } catch {
      return 3;
    }
  });

  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEYS.completedTopics,
      );

      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [completedSessions, setCompletedSessions] = useState(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEYS.completedSessions,
      );

      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });

  const [studiedSeconds, setStudiedSeconds] = useState(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEYS.studiedSeconds,
      );

      return stored ? Number(stored) : 0;
    } catch {
      return 0;
    }
  });

  const [studyDates, setStudyDates] = useState(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEYS.studyDates,
      );

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [subjectStudiedSeconds, setSubjectStudiedSeconds] =
    useState(() => {
      try {
        const stored = localStorage.getItem(
          STORAGE_KEYS.subjectStudiedSeconds,
        );

        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    });

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topicText, setTopicText] = useState("");

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const timerSessionStarted = useRef(false);

  const getSubjectProgress = (subject) => {
    if (!subject.topics.length) return 0;

    const completed = subject.topics.filter(
      (topic) =>
        completedTopics[`${subject.id}-${topic}`],
    ).length;

    return Math.round(
      (completed / subject.topics.length) * 100,
    );
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  const dailyGoalMinutes = Math.max(
    30,
    Math.round(Number(studyHours) * 60),
  );

  const studiedTodaySeconds = studiedSeconds;

  const totalTopics = subjects.reduce(
    (total, subject) => total + subject.topics.length,
    0,
  );

  const totalCompletedTopics = subjects.reduce(
    (total, subject) =>
      total +
      subject.topics.filter(
        (topic) =>
          completedTopics[`${subject.id}-${topic}`],
      ).length,
    0,
  );

  const overallProgress = totalTopics
    ? Math.round(
        (totalCompletedTopics / totalTopics) * 100,
      )
    : 0;

  const getPriorityData = (subject) => {
    const daysRemaining = calculateDaysRemaining(
      subject.examDate,
    );

    const urgencyScore = getUrgencyScore(daysRemaining);

    const difficultyScore = getDifficultyScore(
      subject.difficulty,
    );

    const completedCount = subject.topics.filter(
      (topic) =>
        completedTopics[`${subject.id}-${topic}`],
    ).length;

    const remainingTopics =
      subject.topics.length - completedCount;

    const remainingTopicScore = clamp(
      remainingTopics * 2,
      0,
      20,
    );

    const progressFactor = clamp(
      Math.round((100 - getSubjectProgress(subject)) / 20),
      0,
      5,
    );

    const score = clamp(
      urgencyScore +
        difficultyScore +
        remainingTopicScore +
        progressFactor,
      0,
      100,
    );

    return {
      daysRemaining,
      urgencyScore,
      difficultyScore,
      remainingTopics,
      remainingTopicScore,
      progressFactor,
      score,
    };
  };

  const rankedSubjects = useMemo(() => {
    return subjects
      .map((subject) => ({
        ...subject,
        ...getPriorityData(subject),
      }))
      .sort((a, b) => b.score - a.score);
  }, [subjects, completedTopics]);

  const recommendation = useMemo(() => {
    if (!rankedSubjects.length) return null;

    const topSubject = rankedSubjects[0];

    const incompleteTopics = topSubject.topics.filter(
      (topic) =>
        !completedTopics[
          `${topSubject.id}-${topic}`
        ],
    );

    const recommendedTopic =
      incompleteTopics[0] || topSubject.topics[0];

    return {
      subject: topSubject,
      topic: recommendedTopic,
      score: topSubject.score,
      daysRemaining: topSubject.daysRemaining,
      remainingTopics: topSubject.remainingTopics,
    };
  }, [rankedSubjects, completedTopics]);

  const recoveryPlan = useMemo(() => {
    const remainingMinutes = Math.max(
      0,
      dailyGoalMinutes -
        Math.floor(studiedTodaySeconds / 60),
    );

    if (!rankedSubjects.length) {
      return {
        remainingMinutes,
        tasks: [],
      };
    }

    const weights = rankedSubjects.map(
      (subject) => Math.max(subject.score, 1),
    );

    const totalWeight = weights.reduce(
      (sum, weight) => sum + weight,
      0,
    );

    let allocated = 0;

    const tasks = rankedSubjects
      .slice(0, 3)
      .map((subject, index) => {
        let minutes;

        if (index === rankedSubjects.length - 1) {
          minutes = Math.max(
            0,
            remainingMinutes - allocated,
          );
        } else {
          minutes = Math.round(
            (remainingMinutes * weights[index]) /
              totalWeight,
          );

          allocated += minutes;
        }

        const incompleteTopic = subject.topics.find(
          (topic) =>
            !completedTopics[
              `${subject.id}-${topic}`
            ],
        );

        return {
          subject,
          topic:
            incompleteTopic ||
            subject.topics[0] ||
            "Review",
          minutes,
        };
      });

    return {
      remainingMinutes,
      tasks,
    };
  }, [
    rankedSubjects,
    dailyGoalMinutes,
    studiedTodaySeconds,
    completedTopics,
  ]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.subjects,
      JSON.stringify(subjects),
    );
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studyHours,
      String(studyHours),
    );
  }, [studyHours]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completedTopics,
      JSON.stringify(completedTopics),
    );
  }, [completedTopics]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completedSessions,
      String(completedSessions),
    );
  }, [completedSessions]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studiedSeconds,
      String(studiedSeconds),
    );
  }, [studiedSeconds]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studyDates,
      JSON.stringify(studyDates),
    );
  }, [studyDates]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.subjectStudiedSeconds,
      JSON.stringify(subjectStudiedSeconds),
    );
  }, [subjectStudiedSeconds]);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });

      setStudiedSeconds((previous) => previous + 1);

      if (selectedTopic?.subjectId) {
        setSubjectStudiedSeconds((previous) => ({
          ...previous,
          [selectedTopic.subjectId]:
            (previous[selectedTopic.subjectId] || 0) + 1,
        }));
      }

      setStudyDates((previous) =>
        previous.includes(todayKey)
          ? previous
          : [...previous, todayKey],
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, selectedTopic, todayKey]);

  useEffect(() => {
    if (
      timerSeconds === 0 &&
      isTimerRunning &&
      timerSessionStarted.current
    ) {
      setIsTimerRunning(false);
      setCompletedSessions(
        (previous) => previous + 1,
      );
      timerSessionStarted.current = false;
    }
  }, [timerSeconds, isTimerRunning]);

  const currentStreak = useMemo(() => {
    if (!studyDates.length) return 0;

    const dates = new Set(studyDates);
    let streak = 0;

    const date = new Date();

    while (true) {
      const key = date.toISOString().slice(0, 10);

      if (!dates.has(key)) {
        break;
      }

      streak += 1;
      date.setDate(date.getDate() - 1);
    }

    return streak;
  }, [studyDates]);

  const startTopic = (
    subject,
    topic,
    minutes = 25,
  ) => {
    setSelectedTopic({
      subjectId: subject.id,
      subjectName: subject.name,
      topic,
    });

    setTimerSeconds(
      Math.max(1, Number(minutes)) * 60,
    );

    setIsTimerRunning(true);
    timerSessionStarted.current = true;
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (timerSeconds > 0) {
      setIsTimerRunning(true);
      timerSessionStarted.current = true;
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(25 * 60);
    setSelectedTopic(null);
    timerSessionStarted.current = false;
  };

  const toggleTopic = (subjectId, topic) => {
    const key = `${subjectId}-${topic}`;

    setCompletedTopics((previous) => {
      const updated = {
        ...previous,
      };

      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }

      return updated;
    });
  };

  const resetForm = () => {
    setSubjectName("");
    setExamDate("");
    setDifficulty("Medium");
    setTopicText("");
    setEditingSubject(null);
  };

  const openAddSubject = () => {
    resetForm();
    setShowSubjectForm(true);
  };

  const openEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setExamDate(subject.examDate);
    setDifficulty(
      getDifficultyLabel(subject.difficulty),
    );
    setTopicText(subject.topics.join("\n"));
    setShowSubjectForm(true);
  };

  const saveSubject = (event) => {
    event.preventDefault();

    const name = subjectName.trim();
    const topics = topicText
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean);

    if (!name || !examDate || !topics.length) {
      return;
    }

    if (editingSubject) {
      setSubjects((previous) =>
        previous.map((subject) =>
          subject.id === editingSubject.id
            ? {
                ...subject,
                name,
                examDate,
                difficulty,
                topics,
              }
            : subject,
        ),
      );
    } else {
      const newSubject = {
        id: Date.now(),
        name,
        examDate,
        difficulty,
        topics,
      };

      setSubjects((previous) => [
        ...previous,
        newSubject,
      ]);
    }

    resetForm();
    setShowSubjectForm(false);
  };

  const deleteSubject = (subjectId) => {
    const confirmed = window.confirm(
      "Delete this subject from your study plan?",
    );

    if (!confirmed) return;

    setSubjects((previous) =>
      previous.filter(
        (subject) => subject.id !== subjectId,
      ),
    );

    setCompletedTopics((previous) => {
      const updated = { ...previous };

      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`${subjectId}-`)) {
          delete updated[key];
        }
      });

      return updated;
    });
  };

  const resetDemoData = () => {
    const confirmed = window.confirm(
      "Reset the planner to its original demo data?",
    );

    if (!confirmed) return;

    setSubjects(DEFAULT_SUBJECTS);
    setStudyHours(3);
    setCompletedTopics({});
    setCompletedSessions(0);
    setStudiedSeconds(0);
    setStudyDates([]);
    setSubjectStudiedSeconds({});
    resetTimer();
  };

  const topInsight = recommendation
    ? `Start with ${recommendation.topic}. Your planner selected it because ${recommendation.subject.name} currently has the highest adaptive priority score.`
    : "Add a subject to receive an adaptive recommendation.";

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">SMART STUDY PLANNER</p>

            <h1>
              Plan smarter.
              <br />
              Study better.
              <br />
              Achieve more.
            </h1>

            <p className="hero-description">
              An adaptive study planner that decides what
              you should study based on your exams,
              difficulty, progress and study history.
            </p>
          </div>

          <div className="study-time-card">
            <span className="section-label">
              TODAY'S AVAILABLE STUDY TIME
            </span>

            <h2>
              Tell the planner how much time you have
              today.
            </h2>

            <p>Your adaptive plan will use this time.</p>

            <div className="study-time-input">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={studyHours}
                onChange={(event) =>
                  setStudyHours(
                    Math.max(
                      0.5,
                      Number(event.target.value) || 0.5,
                    ),
                  )
                }
              />

              <span>hours</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="stats-grid">
          <div className="stat-card">
            <span>⏰</span>
            <strong>{studyHours}</strong>
            <small>Hours Available</small>
          </div>

          <div className="stat-card">
            <span>📚</span>
            <strong>{subjects.length}</strong>
            <small>Subjects</small>
          </div>

          <div className="stat-card">
            <span>📝</span>
            <strong>{completedSessions}</strong>
            <small>Study Sessions</small>
          </div>

          <div className="stat-card">
            <span>🔥</span>
            <strong>{currentStreak}</strong>
            <small>Day Streak</small>
          </div>

          <div className="stat-card">
            <span>🎯</span>
            <strong>{overallProgress}%</strong>
            <small>Topic Progress</small>
          </div>
        </section>

        <section className="daily-goal-card">
          <div>
            <span>🎯 DAILY GOAL</span>

            <strong>
              {Math.floor(studiedTodaySeconds / 60)} /{" "}
              {dailyGoalMinutes} minutes
            </strong>
          </div>

          <div className="daily-goal-progress">
            <div
              style={{
                width: `${clamp(
                  (studiedTodaySeconds /
                    (dailyGoalMinutes * 60)) *
                    100,
                  0,
                  100,
                )}%`,
              }}
            />
          </div>

          <strong>
            {Math.round(
              (studiedTodaySeconds /
                (dailyGoalMinutes * 60)) *
                100,
            ) || 0}
            %
          </strong>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">📊 STUDY ANALYTICS</p>

              <h2>
                Understand your study behavior and track
                your progress.
              </h2>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-icon">⏱️</span>

              <h3>Today's Study</h3>

              <p>
                Actual study time vs daily goal
              </p>

              <strong>
                {formatStudyDuration(
                  studiedTodaySeconds,
                )}
              </strong>

              <span>
                {formatStudyDuration(
                  studiedTodaySeconds,
                )}{" "}
                studied • {dailyGoalMinutes} min goal
              </span>
            </div>

            <div className="analytics-card">
              <span className="analytics-icon">🔥</span>

              <h3>Current Streak</h3>

              <strong>{currentStreak} days</strong>

              <span>
                Keep studying every day to build your
                streak.
              </span>
            </div>

            <div className="analytics-card wide">
              <span className="analytics-icon">📚</span>

              <h3>Subject Study Time</h3>

              <p>
                See where your study time is going.
              </p>

              <div className="analytics-list">
                {subjects.map((subject) => (
                  <div
                    className="analytics-row"
                    key={subject.id}
                  >
                    <div>
                      <strong>{subject.name}</strong>
                      <span>
                        {getDifficultyLabel(
                          subject.difficulty,
                        )}
                      </span>
                    </div>

                    <div>
                      <strong>
                        {formatStudyDuration(
                          subjectStudiedSeconds[
                            subject.id
                          ] || 0,
                        )}
                      </strong>

                      <span>
                        {getSubjectProgress(subject)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card wide">
              <span className="analytics-icon">🎯</span>

              <h3>Topic Completion</h3>

              <p>
                Track how much of each subject you have
                completed.
              </p>

              <div className="completion-list">
                {rankedSubjects.map((subject) => {
                  const progress =
                    getSubjectProgress(subject);

                  const completed = subject.topics.filter(
                    (topic) =>
                      completedTopics[
                        `${subject.id}-${topic}`
                      ],
                  ).length;

                  return (
                    <div
                      className="completion-item"
                      key={subject.id}
                    >
                      <div>
                        <strong>{subject.name}</strong>
                        <strong>{progress}%</strong>
                      </div>

                      <div className="progress-bar">
                        <div
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span>
                        {completed} of{" "}
                        {subject.topics.length} topics
                        completed
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="analytics-card">
              <span className="analytics-icon">📈</span>

              <h3>Planned vs Actual</h3>

              <p>
                Compare today's study behavior.
              </p>

              <div className="planned-actual">
                <div>
                  <span>Planned</span>
                  <strong>
                    {dailyGoalMinutes} min
                  </strong>
                </div>

                <div>
                  <span>Actual</span>
                  <strong>
                    {formatStudyDuration(
                      studiedTodaySeconds,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Difference</span>
                  <strong>
                    -
                    {Math.max(
                      0,
                      dailyGoalMinutes -
                        Math.floor(
                          studiedTodaySeconds / 60,
                        ),
                    )}{" "}
                    min
                  </strong>
                </div>
              </div>
            </div>

            <div className="analytics-card insight-card">
              <span className="analytics-icon">💡</span>

              <h3>Smart Insight</h3>

              <p>{topInsight}</p>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">📚 MY SUBJECTS</p>

              <h2>
                Subjects currently in your study plan.
              </h2>
            </div>

            <button
              className="primary-button"
              onClick={openAddSubject}
            >
              + Add Subject
            </button>
          </div>

          {showSubjectForm && (
            <form
              className="subject-form"
              onSubmit={saveSubject}
            >
              <h3>
                {editingSubject
                  ? "Edit Subject"
                  : "Add Subject"}
              </h3>

              <div className="form-grid">
                <label>
                  Subject Name
                  <input
                    value={subjectName}
                    onChange={(event) =>
                      setSubjectName(event.target.value)
                    }
                    placeholder="e.g. Operating Systems"
                  />
                </label>

                <label>
                  Exam Date
                  <input
                    type="date"
                    value={examDate}
                    onChange={(event) =>
                      setExamDate(event.target.value)
                    }
                  />
                </label>

                <label>
                  Difficulty
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value)
                    }
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>

                <label className="full-width">
                  Topics
                  <textarea
                    value={topicText}
                    onChange={(event) =>
                      setTopicText(event.target.value)
                    }
                    placeholder={
                      "Enter one topic per line"
                    }
                    rows="6"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingSubject
                    ? "Save Changes"
                    : "Add Subject"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetForm();
                    setShowSubjectForm(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="subjects-grid">
            {subjects.map((subject) => {
              const progress =
                getSubjectProgress(subject);

              return (
                <article
                  className="subject-card"
                  key={subject.id}
                >
                  <div className="subject-card-top">
                    <div>
                      <h3>{subject.name}</h3>

                      <p>
                        Exam {subject.examDate} •{" "}
                        {subject.topics.length} topics
                      </p>
                    </div>

                    <div className="subject-actions">
                      <button
                        onClick={() =>
                          openEditSubject(subject)
                        }
                        aria-label={`Edit ${subject.name}`}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          deleteSubject(subject.id)
                        }
                        aria-label={`Delete ${subject.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <span
                    className={`difficulty-badge ${getDifficultyLabel(
                      subject.difficulty,
                    ).toLowerCase()}`}
                  >
                    {getDifficultyLabel(
                      subject.difficulty,
                    )}
                  </span>

                  <div className="subject-progress">
                    <div>
                      <span>
                        {Math.round(
                          (progress / 100) *
                            subject.topics.length,
                        )}{" "}
                        / {subject.topics.length} topics
                      </span>

                      <strong>{progress}%</strong>
                    </div>

                    <div className="progress-bar">
                      <div
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {recommendation && (
          <section className="recommendation-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  WHAT SHOULD I STUDY NOW?
                </p>
              </div>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-main">
                <span className="recommendation-icon">
                  🎯
                </span>

                <p className="eyebrow">
                  ADAPTIVE RECOMMENDATION
                </p>

                <h2>
                  Study {recommendation.topic} now
                </h2>

                <h3>
                  {recommendation.subject.name}
                </h3>

                <h4>🧠 Why this topic?</h4>

                <p>
                  <strong>
                    {recommendation.subject.name}
                  </strong>{" "}
                  has an exam in{" "}
                  <strong>
                    {recommendation.daysRemaining}{" "}
                    {recommendation.daysRemaining === 1
                      ? "day"
                      : "days"}
                  </strong>
                  , it is a{" "}
                  <strong>
                    {getDifficultyLabel(
                      recommendation.subject
                        .difficulty,
                    )}
                  </strong>{" "}
                  subject, and you still have{" "}
                  <strong>
                    {recommendation.remainingTopics}
                  </strong>{" "}
                  topics remaining.
                </p>

                <p>
                  The planner selected{" "}
                  <strong>
                    {recommendation.topic}
                  </strong>{" "}
                  because it is incomplete and the
                  subject currently has a high study
                  priority.
                </p>

                <div className="recommendation-facts">
                  <span>
                    📅{" "}
                    {recommendation.daysRemaining}{" "}
                    {recommendation.daysRemaining === 1
                      ? "day"
                      : "days"}{" "}
                    until exam
                  </span>

                  <span>
                    📚 {recommendation.remainingTopics}{" "}
                    topics remaining
                  </span>

                  <span>
                    🎯{" "}
                    {getDifficultyLabel(
                      recommendation.subject
                        .difficulty,
                    )}{" "}
                    difficulty
                  </span>

                  <span>
                    ⏱️ 25 recommended minutes
                  </span>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    startTopic(
                      recommendation.subject,
                      recommendation.topic,
                      25,
                    )
                  }
                >
                  ▶ Start {recommendation.topic}
                </button>
              </div>

              <div className="score-panel">
                <span>PRIORITY SCORE</span>

                <strong>
                  {recommendation.score}
                  <small>/100</small>
                </strong>

                <p>
                  {getScoreLabel(
                    recommendation.score,
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="section-block recovery-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                🔄 ADAPTIVE RECOVERY
              </p>

              <h2>
                The planner adjusts your remaining study
                time based on how much you have actually
                studied today.
              </h2>
            </div>
          </div>

          <div className="recovery-card">
            <div className="recovery-header">
              <div>
                <span>⏱️</span>
                <strong>
                  {recoveryPlan.remainingMinutes} min
                  left
                </strong>
              </div>

              <div className="recovery-summary">
                <div>
                  <span>Planned</span>
                  <strong>
                    {dailyGoalMinutes} min
                  </strong>
                </div>

                <div>
                  <span>Studied</span>
                  <strong>
                    {formatStudyDuration(
                      studiedTodaySeconds,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>
                    {recoveryPlan.remainingMinutes} min
                  </strong>
                </div>
              </div>
            </div>

            <div className="recovery-tasks">
              {recoveryPlan.tasks.map(
                (task, index) => (
                  <div
                    className="recovery-task"
                    key={task.subject.id}
                  >
                    <span className="task-number">
                      {index + 1}
                    </span>

                    <div className="task-content">
                      <h3>{task.topic}</h3>

                      <p>
                        {task.subject.name} •{" "}
                        {getDifficultyLabel(
                          task.subject.difficulty,
                        )}
                      </p>
                    </div>

                    <strong>
                      {task.minutes} min
                    </strong>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        startTopic(
                          task.subject,
                          task.topic,
                          Math.max(
                            1,
                            task.minutes,
                          ),
                        )
                      }
                    >
                      Start
                    </button>
                  </div>
                ),
              )}
            </div>

            <p className="smart-adjustment">
              💡 <strong>Smart adjustment:</strong>{" "}
              Your remaining study time has been
              redistributed toward subjects with higher
              exam urgency, difficulty and unfinished
              topics.
            </p>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                🧠 SMART PLANNER
              </p>

              <h2>Priority ranking</h2>

              <p>
                Subjects are ranked using urgency,
                difficulty, remaining topics and study
                progress.
              </p>
            </div>
          </div>

          <div className="ranking-list">
            {rankedSubjects.map((subject, index) => {
              const progress =
                getSubjectProgress(subject);

              return (
                <article
                  className="ranking-card"
                  key={subject.id}
                >
                  <div className="ranking-number">
                    #{index + 1}
                  </div>

                  <div className="ranking-content">
                    <div className="ranking-top">
                      <div>
                        <h3>{subject.name}</h3>

                        <p>
                          Exam in{" "}
                          {subject.daysRemaining}{" "}
                          {subject.daysRemaining === 1
                            ? "day"
                            : "days"}{" "}
                          •{" "}
                          {getDifficultyLabel(
                            subject.difficulty,
                          )}{" "}
                          • {subject.remainingTopics}{" "}
                          topics remaining
                        </p>
                      </div>

                      <div className="ranking-score">
                        <strong>
                          {subject.score}
                        </strong>

                        <span>/100</span>
                      </div>
                    </div>

                    <div className="score-breakdown">
                      <div>
                        <span>
                          📅 Exam urgency
                        </span>
                        <strong>
                          +{subject.urgencyScore}
                        </strong>
                      </div>

                      <div>
                        <span>
                          🎯 Difficulty
                        </span>
                        <strong>
                          +{subject.difficultyScore}
                        </strong>
                      </div>

                      <div>
                        <span>
                          📚 Remaining topics
                        </span>
                        <strong>
                          +{subject.remainingTopicScore}
                        </strong>
                      </div>

                      <div>
                        <span>
                          📈 Progress factor
                        </span>
                        <strong>
                          +{subject.progressFactor}
                        </strong>
                      </div>
                    </div>

                    <div className="ranking-explanation">
                      <strong>
                        Why this score?
                      </strong>

                      <p>
                        {subject.daysRemaining <= 3
                          ? "The exam is approaching quickly."
                          : "The exam deadline is approaching."}{" "}
                        The subject is{" "}
                        {getDifficultyLabel(
                          subject.difficulty,
                        )}{" "}
                        and has{" "}
                        {subject.remainingTopics}{" "}
                        unfinished topics and is{" "}
                        {progress}% complete.
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                📖 TOPIC PROGRESS
              </p>

              <h2>
                Mark topics as you complete them.
              </h2>
            </div>
          </div>

          <div className="topic-progress-grid">
            {subjects.map((subject) => {
              const progress =
                getSubjectProgress(subject);

              const completed = subject.topics.filter(
                (topic) =>
                  completedTopics[
                    `${subject.id}-${topic}`
                  ],
              ).length;

              return (
                <article
                  className="topic-card"
                  key={subject.id}
                >
                  <div className="topic-header">
                    <div>
                      <h3>{subject.name}</h3>

                      <p>
                        {progress}% • {completed} of{" "}
                        {subject.topics.length} topics
                        completed
                      </p>
                    </div>

                    <strong>{progress}%</strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="topic-list">
                    {subject.topics.map((topic) => {
                      const isCompleted =
                        Boolean(
                          completedTopics[
                            `${subject.id}-${topic}`
                          ],
                        );

                      return (
                        <button
                          key={topic}
                          className={`topic-chip ${
                            isCompleted
                              ? "completed"
                              : ""
                          }`}
                          onClick={() =>
                            toggleTopic(
                              subject.id,
                              topic,
                            )
                          }
                        >
                          {isCompleted ? "☑️" : "⬜"}{" "}
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                ⏱️ FOCUS TIMER
              </p>

              <h2>📚 Study Session</h2>

              <p>
                {selectedTopic
                  ? `Focused session: ${selectedTopic.topic} • ${selectedTopic.subjectName}`
                  : "Start a recommended topic above to begin a focus session."}
              </p>
            </div>
          </div>

          <div className="timer-card">
            <div className="timer-display">
              {formatTime(timerSeconds)}
            </div>

            <div className="timer-actions">
              {!isTimerRunning ? (
                <button
                  className="primary-button"
                  onClick={
                    timerSeconds === 0
                      ? resetTimer
                      : resumeTimer
                  }
                >
                  ▶{" "}
                  {timerSeconds === 25 * 60 &&
                  !selectedTopic
                    ? "Start"
                    : "Resume"}
                </button>
              ) : (
                <button
                  className="secondary-button"
                  onClick={pauseTimer}
                >
                  ⏸ Pause
                </button>
              )}

              <button
                className="secondary-button"
                onClick={resetTimer}
              >
                ↻ Reset
              </button>
            </div>

            <p>
              ✓ Session completes automatically at 00:00
            </p>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                📋 TODAY'S STUDY TASKS
              </p>

              <h2>Recommended focus sessions</h2>
            </div>
          </div>

          <div className="task-list">
            {recommendation ? (
              <div className="task-card">
                <span className="task-icon">
                  🎯
                </span>

                <div>
                  <h3>
                    {recommendation.topic}
                  </h3>

                  <p>
                    {recommendation.subject.name} •
                    25 minutes
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    startTopic(
                      recommendation.subject,
                      recommendation.topic,
                      25,
                    )
                  }
                >
                  Start
                </button>
              </div>
            ) : (
              <p>
                Add a subject to generate study tasks.
              </p>
            )}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                📅 UPCOMING EXAMS
              </p>

              <h2>
                Keep your deadlines visible.
              </h2>
            </div>
          </div>

          <div className="exam-grid">
            {rankedSubjects.map((subject) => (
              <div
                className="exam-card"
                key={subject.id}
              >
                <h3>{subject.name}</h3>

                <p>Exam: {subject.examDate}</p>

                <strong>
                  {subject.daysRemaining}{" "}
                  {subject.daysRemaining === 1
                    ? "day"
                    : "days"}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="reset-section">
          <button
            className="reset-button"
            onClick={resetDemoData}
          >
            🧹 Reset Demo Data
          </button>
        </section>
      </main>

      <footer className="footer">
        Smart Study Planner • Adaptive planning using
        exam urgency, difficulty, progress and study
        history.
      </footer>
    </div>
  );
}

export default App;