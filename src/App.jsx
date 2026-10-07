import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./App.css";

const STORAGE_KEYS = {
  subjects: "smartPlannerSubjects",
  studyHours: "studyHours",
  completedTopics: "completedTopics",
  completedSessions: "completedSessions",
  studiedSeconds: "studiedSeconds",
  studyDates: "studyDates",
  subjectStudiedSeconds: "subjectStudiedSeconds",
};

const DEFAULT_SUBJECTS = [
  {
    id: "ds",
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
    id: "coa",
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
    id: "dbms",
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

const getTodayKey = () =>
  new Date().toISOString().slice(0, 10);

const getInitialForm = () => ({
  name: "",
  examDate: "",
  difficulty: "Medium",
  topics: "",
});

const getStoredValue = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);

    if (saved === null) {
      return fallback;
    }

    return JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const getDifficultyScore = (difficulty) => {
  if (difficulty === "Hard") {
    return 1;
  }

  if (difficulty === "Medium") {
    return 0.65;
  }

  return 0.35;
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const formatStudyDuration = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
};

const calculateDaysRemaining = (examDate) => {
  if (!examDate) {
    return 999;
  }

  const today = new Date();
  const exam = new Date(`${examDate}T23:59:59`);

  const difference = exam.getTime() - today.getTime();

  return Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24))
  );
};

const getUrgencyScore = (daysRemaining) => {
  if (daysRemaining <= 0) {
    return 1;
  }

  if (daysRemaining === 1) {
    return 1;
  }

  if (daysRemaining === 2) {
    return 0.9;
  }

  if (daysRemaining === 3) {
    return 0.78;
  }

  if (daysRemaining <= 5) {
    return 0.65;
  }

  if (daysRemaining <= 7) {
    return 0.5;
  }

  if (daysRemaining <= 14) {
    return 0.3;
  }

  return 0.15;
};

const getUrgencyLabel = (daysRemaining) => {
  if (daysRemaining <= 1) {
    return "Critical";
  }

  if (daysRemaining <= 3) {
    return "High";
  }

  if (daysRemaining <= 7) {
    return "Medium";
  }

  return "Low";
};

const getScoreLabel = (score) => {
  if (score >= 85) {
    return "Critical priority";
  }

  if (score >= 65) {
    return "High priority";
  }

  if (score >= 45) {
    return "Medium priority";
  }

  return "Low priority";
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

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
  difficulty: normalizeDifficulty(
    subject.difficulty
  ),
  topics: Array.isArray(subject.topics)
    ? subject.topics
    : [],
});
function App() { console.log("SMART PLANNER APP STARTED");
  const [subjects, setSubjects] = useState(() => {
    const storedSubjects = getStoredValue(
      STORAGE_KEYS.subjects,
      null
    );

    if (!Array.isArray(storedSubjects)) {
      return DEFAULT_SUBJECTS;
    }

    return storedSubjects.map(
      normalizeSubject
    );
  });

  const [studyHours, setStudyHours] = useState(() =>
    getStoredValue(STORAGE_KEYS.studyHours, 3)
  );

  const [completedTopics, setCompletedTopics] = useState(
    () =>
      getStoredValue(
        STORAGE_KEYS.completedTopics,
        {}
      )
  );

  const [completedSessions, setCompletedSessions] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.completedSessions,
        0
      )
    );

  const [studiedSeconds, setStudiedSeconds] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.studiedSeconds,
        0
      )
    );

  const [studyDates, setStudyDates] = useState(() =>
    getStoredValue(STORAGE_KEYS.studyDates, [])
  );

  const [subjectStudiedSeconds, setSubjectStudiedSeconds] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.subjectStudiedSeconds,
        {}
      )
    );

  const [timerSeconds, setTimerSeconds] =
    useState(25 * 60);

  const [isTimerRunning, setIsTimerRunning] =
    useState(false);

  const [selectedTopic, setSelectedTopic] =
    useState(null);

  const [showForm, setShowForm] = useState(false);

  const [editingSubjectId, setEditingSubjectId] =
    useState(null);

  const [form, setForm] = useState(
    getInitialForm()
  );

  const timerSessionStarted = useRef(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.subjects,
      JSON.stringify(subjects)
    );
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studyHours,
      JSON.stringify(studyHours)
    );
  }, [studyHours]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completedTopics,
      JSON.stringify(completedTopics)
    );
  }, [completedTopics]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completedSessions,
      JSON.stringify(completedSessions)
    );
  }, [completedSessions]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studiedSeconds,
      JSON.stringify(studiedSeconds)
    );
  }, [studiedSeconds]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studyDates,
      JSON.stringify(studyDates)
    );
  }, [studyDates]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.subjectStudiedSeconds,
      JSON.stringify(
        subjectStudiedSeconds
      )
    );
  }, [subjectStudiedSeconds]);

  const totalTopics = useMemo(
    () =>
      subjects.reduce(
        (total, subject) =>
          total + subject.topics.length,
        0
      ),
    [subjects]
  );

  const completedTopicCount = useMemo(
    () =>
      Object.values(completedTopics).filter(Boolean)
        .length,
    [completedTopics]
  );

  const topicProgress =
    totalTopics === 0
      ? 0
      : Math.round(
          (completedTopicCount / totalTopics) *
            100
        );

  const dailyGoalMinutes =
    Number(studyHours) * 60;

  const studiedMinutes = Math.floor(
    studiedSeconds / 60
  );

  const dailyGoalProgress =
    dailyGoalMinutes === 0
      ? 0
      : clamp(
          Math.round(
            (studiedMinutes /
              dailyGoalMinutes) *
              100
          ),
          0,
          100
        );

  const remainingMinutes = Math.max(
    0,
    dailyGoalMinutes - studiedMinutes
  );

  const currentStreak = useMemo(() => {
    if (studyDates.length === 0) {
      return 0;
    }

    const dates = new Set(studyDates);

    let streak = 0;
    const cursor = new Date();

    while (true) {
      const key = cursor
        .toISOString()
        .slice(0, 10);

      if (!dates.has(key)) {
        break;
      }

      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [studyDates]);

  const rankedSubjects = useMemo(() => {
    return subjects
      .map((subject) => {
        const completed = subject.topics.filter(
          (topic) =>
            completedTopics[
              `${subject.id}-${topic}`
            ]
        ).length;

        const remainingTopics =
          subject.topics.length -
          completed;

        const progress =
          subject.topics.length === 0
            ? 0
            : completed /
              subject.topics.length;

        const daysRemaining =
          calculateDaysRemaining(
            subject.examDate
          );

        const urgency =
          getUrgencyScore(daysRemaining);

        const difficulty =
          getDifficultyScore(
            subject.difficulty
          );

        const topicNeed =
          subject.topics.length === 0
            ? 0
            : clamp(
                remainingTopics /
                  subject.topics.length,
                0,
                1
              );

        const progressAdjustment =
          1 - progress;

        /*
          Explainable scoring model:

          Exam urgency      = 50%
          Difficulty        = 25%
          Remaining topics  = 20%
          Progress          = 5%
        */

        const urgencyPoints =
          urgency * 50;

        const difficultyPoints =
          difficulty * 25;

        const remainingTopicPoints =
          topicNeed * 20;

        const progressPoints =
          progressAdjustment * 5;

        const rawScore =
          urgencyPoints +
          difficultyPoints +
          remainingTopicPoints +
          progressPoints;

        const score = Math.round(
          clamp(rawScore, 0, 100)
        );

        return {
          ...subject,
          completed,
          remainingTopics,
          progress,
          daysRemaining,
          urgency,
          difficulty,
          topicNeed,
          progressAdjustment,
          urgencyPoints,
          difficultyPoints,
          remainingTopicPoints,
          progressPoints,
          score,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return (
          a.daysRemaining -
          b.daysRemaining
        );
      });
  }, [subjects, completedTopics]);

  const highestPrioritySubject =
    rankedSubjects[0] || null;

  const recommendation = useMemo(() => {
    if (!highestPrioritySubject) {
      return null;
    }

    const subject =
      highestPrioritySubject;

    const firstIncompleteTopic =
      subject.topics.find(
        (topic) =>
          !completedTopics[
            `${subject.id}-${topic}`
          ]
      );

    if (!firstIncompleteTopic) {
      return null;
    }

    let recommendedMinutes = 25;

    if (subject.score >= 85) {
      recommendedMinutes = 25;
    } else if (subject.score >= 65) {
      recommendedMinutes = 30;
    } else {
      recommendedMinutes = 35;
    }

    if (remainingMinutes < 25) {
      recommendedMinutes = Math.max(
        5,
        remainingMinutes
      );
    }

    return {
      subject,
      topic: firstIncompleteTopic,
      recommendedMinutes,
    };
  }, [
    highestPrioritySubject,
    completedTopics,
    remainingMinutes,
  ]);

  const recoveryPlan = useMemo(() => {
    if (
      remainingMinutes <= 0 ||
      rankedSubjects.length === 0
    ) {
      return [];
    }

    const activeSubjects =
      rankedSubjects.filter(
        (subject) =>
          subject.remainingTopics > 0
      );

    if (activeSubjects.length === 0) {
      return [];
    }

    const totalScore =
      activeSubjects.reduce(
        (sum, subject) =>
          sum + subject.score,
        0
      );

    let allocated = 0;

    return activeSubjects
      .map((subject, index) => {
        let minutes;

        if (
          index ===
          activeSubjects.length - 1
        ) {
          minutes =
            remainingMinutes -
            allocated;
        } else {
          minutes = Math.max(
            10,
            Math.round(
              (remainingMinutes *
                subject.score) /
                totalScore
            )
          );
        }

        allocated += minutes;

        const topic =
          subject.topics.find(
            (item) =>
              !completedTopics[
                `${subject.id}-${item}`
              ]
          );

        return {
          subject,
          topic,
          minutes,
        };
      })
      .filter(
        (item) => item.minutes > 0
      );
  }, [
    remainingMinutes,
    rankedSubjects,
    completedTopics,
  ]);

  const startTopic = (
    subject,
    topic,
    minutes = 25
  ) => {
    setSelectedTopic({
      subjectId: subject.id,
      subjectName: subject.name,
      topic,
    });

    setTimerSeconds(
      Math.max(1, minutes) * 60
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
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(25 * 60);
    setSelectedTopic(null);
    timerSessionStarted.current = false;
  };

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimerSeconds((previous) => {
        if (previous <= 1) {
          setIsTimerRunning(false);
          return 0;
        }

        return previous - 1;
      });

      setStudiedSeconds(
        (previous) =>
          previous + 1
      );

      if (selectedTopic) {
        setSubjectStudiedSeconds(
          (previous) => ({
            ...previous,
            [selectedTopic.subjectId]:
              (previous[
                selectedTopic.subjectId
              ] || 0) + 1,
          })
        );
      }
    }, 1000);

    return () =>
      clearInterval(interval);
  }, [
    isTimerRunning,
    selectedTopic,
  ]);

  useEffect(() => {
    if (
      timerSeconds === 0 &&
      timerSessionStarted.current
    ) {
      setCompletedSessions(
        (previous) => previous + 1
      );

      const today =
        getTodayKey();

      setStudyDates((previous) => {
        if (
          previous.includes(today)
        ) {
          return previous;
        }

        return [
          ...previous,
          today,
        ];
      });

      timerSessionStarted.current = false;
    }
  }, [timerSeconds]);

  const toggleTopic = (
    subjectId,
    topic
  ) => {
    const key = `${subjectId}-${topic}`;

    setCompletedTopics(
      (previous) => ({
        ...previous,
        [key]: !previous[key],
      })
    );
  };

  const openAddForm = () => {
    setEditingSubjectId(null);
    setForm(getInitialForm());
    setShowForm(true);
  };

  const openEditForm = (subject) => {
    setEditingSubjectId(
      subject.id
    );

    setForm({
      name: subject.name,
      examDate: subject.examDate,
      difficulty: subject.difficulty,
      topics: subject.topics.join(
        ", "
      ),
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSubjectId(null);
    setForm(getInitialForm());
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    const topicList = form.topics
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean);

    if (
      !form.name.trim() ||
      !form.examDate ||
      topicList.length === 0
    ) {
      return;
    }

    if (editingSubjectId) {
      setSubjects((previous) =>
        previous.map((subject) =>
          subject.id ===
          editingSubjectId
            ? {
                ...subject,
                name: form.name.trim(),
                examDate:
                  form.examDate,
                difficulty:
                  form.difficulty,
                topics: topicList,
              }
            : subject
        )
      );
    } else {
      const newSubject = {
        id: `subject-${Date.now()}`,
        name: form.name.trim(),
        examDate: form.examDate,
        difficulty: form.difficulty,
        topics: topicList,
      };

      setSubjects((previous) => [
        ...previous,
        newSubject,
      ]);
    }

    closeForm();
  };

  const deleteSubject = (subjectId) => {
    const subject =
      subjects.find(
        (item) =>
          item.id === subjectId
      );

    if (!subject) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${subject.name}?`
    );

    if (!shouldDelete) {
      return;
    }

    setSubjects((previous) =>
      previous.filter(
        (item) =>
          item.id !== subjectId
      )
    );

    setSubjectStudiedSeconds(
      (previous) => {
        const copy = {
          ...previous,
        };

        delete copy[subjectId];

        return copy;
      }
    );
  };

  const resetDemoData = () => {
    const shouldReset = window.confirm(
      "Reset all Smart Study Planner data?"
    );

    if (!shouldReset) {
      return;
    }

    setSubjects(DEFAULT_SUBJECTS);
    setStudyHours(3);
    setCompletedTopics({});
    setCompletedSessions(0);
    setStudiedSeconds(0);
    setStudyDates([]);
    setSubjectStudiedSeconds({});
    setTimerSeconds(25 * 60);
    setIsTimerRunning(false);
    setSelectedTopic(null);

    Object.values(STORAGE_KEYS).forEach(
      (key) =>
        localStorage.removeItem(key)
    );
  };

  const getSubjectStudiedSeconds = (
    subjectId
  ) =>
    subjectStudiedSeconds[
      subjectId
    ] || 0;

  const getInsight = () => {
    if (!highestPrioritySubject) {
      return "Add a subject to generate an adaptive study plan.";
    }

    if (
      highestPrioritySubject.daysRemaining <=
      1
    ) {
      return `Start with ${recommendation?.topic || "your next topic"}. Your planner selected it because ${highestPrioritySubject.name} has a very near exam deadline and a high current priority.`;
    }

    return `Start with ${recommendation?.topic || "your next topic"}. Your planner selected it because ${highestPrioritySubject.name} currently has the highest adaptive priority score.`;
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            SMART STUDY PLANNER
          </p>

          <h1>
            Plan smarter.
            <br />
            Study better.
            <br />
            Achieve more.
          </h1>

          <p className="hero-description">
            An adaptive study planner that
            decides what you should study based
            on your exams, difficulty, progress
            and study history.
          </p>
        </div>
      </header>

      <main className="container">
        <section className="study-time-card">
          <div>
            <p className="section-label">
              TODAY'S AVAILABLE STUDY TIME
            </p>

            <h2>
              Tell the planner how much time
              you have today.
            </h2>

            <p>
              Your adaptive plan will use this
              time.
            </p>
          </div>

          <div className="hours-control">
            <input
              type="number"
              min="1"
              max="12"
              value={studyHours}
              onChange={(event) =>
                setStudyHours(
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    )
                  )
                )
              }
            />

            <span>hours</span>
          </div>
        </section>

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
            <strong>
              {completedSessions}
            </strong>
            <small>Study Sessions</small>
          </div>

          <div className="stat-card">
            <span>🔥</span>
            <strong>{currentStreak}</strong>
            <small>Day Streak</small>
          </div>

          <div className="stat-card">
            <span>🎯</span>
            <strong>{topicProgress}%</strong>
            <small>Topic Progress</small>
          </div>
        </section>

        <section className="daily-goal">
          <div className="section-heading">
            <span>🎯 DAILY GOAL</span>
            <strong>
              {studiedMinutes} /{" "}
              {dailyGoalMinutes} minutes
            </strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${dailyGoalProgress}%`,
              }}
            />
          </div>

          <strong>
            {dailyGoalProgress}%
          </strong>
        </section>

        <section className="section">
          <div className="section-title">
            <p className="section-label">
              📊 STUDY ANALYTICS
            </p>

            <h2>
              Understand your study behavior
              and track your progress.
            </h2>
          </div>

          <div className="analytics-grid">
            <article className="analytics-card">
              <span>⏱️</span>
              <h3>Today's Study</h3>
              <p>
                Actual study time vs daily goal
              </p>

              <strong>
                {formatStudyDuration(
                  studiedSeconds
                )}
              </strong>

              <small>
                {formatStudyDuration(
                  studiedSeconds
                )}{" "}
                studied •{" "}
                {dailyGoalMinutes} min goal
              </small>
            </article>

            <article className="analytics-card">
              <span>🔥</span>
              <h3>Current Streak</h3>

              <strong>
                {currentStreak} days
              </strong>

              <small>
                Keep studying every day to build
                your streak.
              </small>
            </article>

            <article className="analytics-card">
              <span>📚</span>
              <h3>Subject Study Time</h3>

              <p>
                See where your study time is
                going.
              </p>

              <div className="subject-time-list">
                {subjects.map((subject) => (
                  <div
                    className="subject-time-row"
                    key={subject.id}
                  >
                    <span>
                      {subject.name}
                      <small>
                        {subject.difficulty}
                      </small>
                    </span>

                    <strong>
                      {formatStudyDuration(
                        getSubjectStudiedSeconds(
                          subject.id
                        )
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="analytics-card">
              <span>🎯</span>
              <h3>Topic Completion</h3>

              <p>
                Track how much of each subject
                you have completed.
              </p>

              {rankedSubjects.map(
                (subject) => (
                  <div
                    className="mini-progress"
                    key={subject.id}
                  >
                    <div className="mini-progress-header">
                      <span>
                        {subject.name}
                      </span>

                      <strong>
                        {Math.round(
                          subject.progress *
                            100
                        )}
                        %
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            subject.progress *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <small>
                      {subject.completed} of{" "}
                      {subject.topics.length}{" "}
                      topics completed
                    </small>
                  </div>
                )
              )}
            </article>

            <article className="analytics-card">
              <span>📈</span>
              <h3>Planned vs Actual</h3>

              <p>
                Compare today's study behavior.
              </p>

              <div className="comparison-list">
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
                      studiedSeconds
                    )}
                  </strong>
                </div>

                <div>
                  <span>Difference</span>
                  <strong>
                    {studiedMinutes -
                      dailyGoalMinutes}{" "}
                    min
                  </strong>
                </div>
              </div>
            </article>

            <article className="analytics-card insight-card">
              <span>💡</span>
              <h3>Smart Insight</h3>

              <p>{getInsight()}</p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-title-row">
            <div>
              <p className="section-label">
                📚 MY SUBJECTS
              </p>

              <h2>
                Subjects currently in your
                study plan.
              </h2>
            </div>

            <button
              className="primary-button"
              onClick={openAddForm}
            >
              + Add Subject
            </button>
          </div>

          {showForm && (
            <form
              className="subject-form"
              onSubmit={handleFormSubmit}
            >
              <h3>
                {editingSubjectId
                  ? "Edit Subject"
                  : "Add Subject"}
              </h3>

              <input
                placeholder="Subject name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />

              <input
                type="date"
                value={form.examDate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    examDate:
                      event.target.value,
                  })
                }
              />

              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm({
                    ...form,
                    difficulty:
                      event.target.value,
                  })
                }
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>

              <textarea
                placeholder="Topics separated by commas"
                value={form.topics}
                onChange={(event) =>
                  setForm({
                    ...form,
                    topics:
                      event.target.value,
                  })
                }
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Subject
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="subject-grid">
            {subjects.map((subject) => {
              const rankedSubject =
                rankedSubjects.find(
                  (item) =>
                    item.id === subject.id
                );

              return (
                <article
                  className="subject-card"
                  key={subject.id}
                >
                  <div className="subject-card-top">
                    <div>
                      <h3>
                        {subject.name}
                      </h3>

                      <p>
                        Exam{" "}
                        {subject.examDate} •{" "}
                        {subject.topics.length}{" "}
                        topics
                      </p>
                    </div>

                    <div className="subject-actions">
                      <button
                        onClick={() =>
                          openEditForm(
                            subject
                          )
                        }
                        title="Edit subject"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          deleteSubject(
                            subject.id
                          )
                        }
                        title="Delete subject"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <span
                    className={`difficulty ${String(subject.difficulty).toLowerCase()}`}
                  >
                    {subject.difficulty}
                  </span>

                  <div className="subject-progress">
                    <div>
                      <strong>
                        {
                          rankedSubject?.completed
                        }{" "}
                        /{" "}
                        {
                          subject.topics.length
                        }{" "}
                        topics
                      </strong>

                      <strong>
                        {Math.round(
                          (rankedSubject?.progress ||
                            0) * 100
                        )}
                        %
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (rankedSubject?.progress ||
                              0) * 100
                          }%`,
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
            <p className="section-label">
              WHAT SHOULD I STUDY NOW?
            </p>

            <div className="recommendation-card">
              <div className="recommendation-main">
                <span className="recommendation-icon">
                  🎯
                </span>

                <div>
                  <span className="badge">
                    ADAPTIVE RECOMMENDATION
                  </span>

                  <h2>
                    Study{" "}
                    {recommendation.topic}{" "}
                    now
                  </h2>

                  <h3>
                    {recommendation.subject.name}
                  </h3>

                  <div className="why-topic">
                    <h4>
                      🧠 Why this topic?
                    </h4>

                    <p>
                      <strong>
                        {
                          recommendation.subject
                            .name
                        }
                      </strong>{" "}
                      has an exam in{" "}
                      <strong>
                        {
                          recommendation.subject
                            .daysRemaining
                        }
                      </strong>{" "}
                      day
                      {recommendation.subject
                        .daysRemaining !== 1
                        ? "s"
                        : ""}
                      , it is a{" "}
                      <strong>
                        {
                          recommendation.subject
                            .difficulty
                        }
                      </strong>{" "}
                      subject, and you still
                      have{" "}
                      <strong>
                        {
                          recommendation.subject
                            .remainingTopics
                        }
                      </strong>{" "}
                      topics remaining.
                    </p>

                    <p>
                      The planner selected{" "}
                      <strong>
                        {recommendation.topic}
                      </strong>{" "}
                      because it is incomplete
                      and the subject currently
                      has a high study priority.
                    </p>
                  </div>

                  <div className="recommendation-facts">
                    <span>
                      📅{" "}
                      {
                        recommendation.subject
                          .daysRemaining
                      }{" "}
                      day
                      {recommendation.subject
                        .daysRemaining !== 1
                        ? "s"
                        : ""}{" "}
                      until exam
                    </span>

                    <span>
                      📚{" "}
                      {
                        recommendation.subject
                          .remainingTopics
                      }{" "}
                      topics remaining
                    </span>

                    <span>
                      🎯{" "}
                      {
                        recommendation.subject
                          .difficulty
                      }{" "}
                      difficulty
                    </span>

                    <span>
                      ⏱️{" "}
                      {
                        recommendation
                          .recommendedMinutes
                      }{" "}
                      recommended minutes
                    </span>
                  </div>

                  <button
                    className="primary-button"
                    onClick={() =>
                      startTopic(
                        recommendation.subject,
                        recommendation.topic,
                        recommendation.recommendedMinutes
                      )
                    }
                  >
                    ▶ Start{" "}
                    {recommendation.topic}
                  </button>
                </div>
              </div>

              <div className="score-panel">
                <span>PRIORITY SCORE</span>

                <strong>
                  {
                    recommendation.subject
                      .score
                  }
                  <small>/100</small>
                </strong>

                <p>
                  {
                    getScoreLabel(
                      recommendation.subject
                        .score
                    )
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <p className="section-label">
            🔄 ADAPTIVE RECOVERY
          </p>

          <h2>
            The planner adjusts your remaining
            study time based on how much you
            have actually studied today.
          </h2>

          <div className="recovery-summary">
            <div>
              <span>⏱️</span>
              <strong>
                {remainingMinutes} min left
              </strong>
            </div>

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
                  studiedSeconds
                )}
              </strong>
            </div>

            <div>
              <span>Remaining</span>
              <strong>
                {remainingMinutes} min
              </strong>
            </div>
          </div>

          <div className="recovery-list">
            {recoveryPlan.map(
              (item, index) => (
                <article
                  className="recovery-card"
                  key={item.subject.id}
                >
                  <div className="rank-number">
                    {index + 1}
                  </div>

                  <div>
                    <h3>
                      {item.topic}
                    </h3>

                    <p>
                      {item.subject.name} �{" "}
                      {item.subject.difficulty >= 0.85
                        ? "Hard"
                        : item.subject.difficulty >= 0.5
                        ? "Medium"
                        : "Easy"}
                    </p>

                    <strong>
                      {item.minutes} min
                    </strong>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      startTopic(
                        item.subject,
                        item.topic,
                        item.minutes
                      )
                    }
                  >
                    Start
                  </button>
                </article>
              )
            )}
          </div>

          <div className="smart-adjustment">
            💡{" "}
            <strong>
              Smart adjustment:
            </strong>{" "}
            Your remaining study time has been
            redistributed toward subjects with
            higher exam urgency, difficulty and
            unfinished topics.
          </div>
        </section>

        <section className="section">
          <p className="section-label">
            🧠 SMART PLANNER
          </p>

          <h2>Priority ranking</h2>

          <p>
            Subjects are ranked using urgency,
            difficulty, remaining topics and
            study progress.
          </p>

          <div className="ranking-list">
            {rankedSubjects.map(
              (subject, index) => (
                <article
                  className="ranking-card"
                  key={subject.id}
                >
                  <div className="ranking-number">
                    #{index + 1}
                  </div>

                  <div className="ranking-content">
                    <div className="ranking-header">
                      <div>
                        <h3>
                          {subject.name}
                        </h3>

                        <p>
                          Exam in{" "}
                          {
                            subject.daysRemaining
                          }{" "}
                          day
                          {subject.daysRemaining !==
                          1
                            ? "s"
                            : ""}{" "}
                          �{" "}
                          {subject.difficulty >= 0.85
                            ? "Hard"
                            : subject.difficulty >= 0.5
                            ? "Medium"
                            : "Easy"} �{" "}
                          {
                            subject.remainingTopics
                          }{" "}
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

                    <div className="score-bar">
                      <div
                        style={{
                          width: `${subject.score}%`,
                        }}
                      />
                    </div>

                    <div className="score-breakdown">
                      <div>
                        <span>
                          📅 Exam urgency
                        </span>
                        <strong>
                          +
                          {Math.round(
                            subject.urgencyPoints
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          🎯 Difficulty
                        </span>
                        <strong>
                          +
                          {Math.round(
                            subject.difficultyPoints
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          📚 Remaining topics
                        </span>
                        <strong>
                          +
                          {Math.round(
                            subject.remainingTopicPoints
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          📈 Progress factor
                        </span>
                        <strong>
                          +
                          {Math.round(
                            subject.progressPoints
                          )}
                        </strong>
                      </div>
                    </div>

                    <p className="ranking-explanation">
                      <strong>
                        Why this score?
                      </strong>{" "}
                      {subject.daysRemaining <=
                      1
                        ? "The exam is extremely close. "
                        : subject.daysRemaining <=
                          3
                        ? "The exam is approaching quickly. "
                        : ""}
                      The subject is{" "}
                      {String(subject.difficulty).toLowerCase()}
                      , has{" "}
                      {subject.remainingTopics}{" "}
                      unfinished topics and is{" "}
                      {Math.round(
                        subject.progress * 100
                      )}
                      % complete.
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="section">
          <p className="section-label">
            📖 TOPIC PROGRESS
          </p>

          <h2>
            Mark topics as you complete them.
          </h2>

          <div className="topic-subject-list">
            {subjects.map((subject) => {
              const completed =
                subject.topics.filter(
                  (topic) =>
                    completedTopics[
                      `${subject.id}-${topic}`
                    ]
                ).length;

              const progress =
                subject.topics.length === 0
                  ? 0
                  : Math.round(
                      (completed /
                        subject.topics.length) *
                        100
                    );

              return (
                <article
                  className="topic-card"
                  key={subject.id}
                >
                  <div className="topic-header">
                    <div>
                      <h3>
                        {subject.name}
                      </h3>

                      <p>
                        {progress}% •{" "}
                        {completed} of{" "}
                        {subject.topics.length}{" "}
                        topics completed
                      </p>
                    </div>

                    <strong>
                      {progress}%
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="topic-list">
                    {subject.topics.map(
                      (topic) => {
                        const key = `${subject.id}-${topic}`;
                        const isComplete =
                          Boolean(
                            completedTopics[
                              key
                            ]
                          );

                        return (
                          <button
                            key={topic}
                            className={`topic-chip ${
                              isComplete
                                ? "completed"
                                : ""
                            }`}
                            onClick={() =>
                              toggleTopic(
                                subject.id,
                                topic
                              )
                            }
                          >
                            {isComplete
                              ? "✅"
                              : "⬜"}
                            {topic}
                          </button>
                        );
                      }
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="timer-section">
          <p className="section-label">
            ⏱️ FOCUS TIMER
          </p>

          <div className="timer-card">
            <div>
              <h2>
                📚 Study Session
              </h2>

              <p>
                {selectedTopic
                  ? `Currently studying ${selectedTopic.topic} • ${selectedTopic.subjectName}`
                  : "Start a recommended topic above to begin a focus session."}
              </p>
            </div>

            <div className="timer-display">
              {formatTime(timerSeconds)}
            </div>

           ```jsx
<div className="timer-actions">
  {!isTimerRunning ? (
    <button
      className="primary-button"
      onClick={() => {
        if (timerSessionStarted.current) {
          resumeTimer();
          return;
        }

        if (recommendation) {
          startTopic(
            recommendation.subject,
            recommendation.topic,
            recommendation.recommendedMinutes
          );
        }
      }}
    >
      ▶{" "}
      {timerSessionStarted.current
        ? "Resume"
        : "Start"}
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
```


            <p className="timer-note">
              ✓ Session completes automatically
              at 00:00
            </p>
          </div>
        </section>

        <section className="section">
          <p className="section-label">
            📋 TODAY'S STUDY TASKS
          </p>

          <h2>
            Recommended focus sessions
          </h2>

          {recommendation ? (
            <div className="task-card">
              <span>🎯</span>

              <div>
                <h3>
                  {recommendation.topic}
                </h3>

                <p>
                  {recommendation.subject.name} •{" "}
                  {
                    recommendation
                      .recommendedMinutes
                  }{" "}
                  minutes
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  startTopic(
                    recommendation.subject,
                    recommendation.topic,
                    recommendation.recommendedMinutes
                  )
                }
              >
                Start
              </button>
            </div>
          ) : (
            <p>
              🎉 All current topics are
              complete!
            </p>
          )}
        </section>

        <section className="section">
          <p className="section-label">
            📅 UPCOMING EXAMS
          </p>

          <h2>
            Keep your deadlines visible.
          </h2>

          <div className="exam-grid">
            {rankedSubjects
              .slice()
              .sort(
                (a, b) =>
                  a.daysRemaining -
                  b.daysRemaining
              )
              .map((subject) => (
                <article
                  className="exam-card"
                  key={subject.id}
                >
                  <h3>
                    {subject.name}
                  </h3>

                  <p>
                    Exam:{" "}
                    {subject.examDate}
                  </p>

                  <strong>
                    {subject.daysRemaining}{" "}
                    day
                    {subject.daysRemaining !==
                    1
                      ? "s"
                      : ""}
                  </strong>
                </article>
              ))}
          </div>
        </section>

        <section className="reset-section">
          <button
            className="danger-button"
            onClick={resetDemoData}
          >
            🧹 Reset Demo Data
          </button>
        </section>
      </main>

      <footer>
        <p>
          Smart Study Planner • Adaptive
          planning using exam urgency,
          difficulty, progress and study
          history.
        </p>
      </footer>
    </div>
  );
}

export default App;





