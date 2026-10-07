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
  subjectStudiedSeconds:
    "subjectStudiedSeconds",
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

const getTodayKey = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInitialForm = () => ({
  name: "",
  examDate: "",
  difficulty: "Medium",
  topics: "",
});

const getStoredValue = (key, fallback) => {
  try {
    const value =
      localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getDifficultyScore = (
  difficulty
) => {
  if (difficulty === "Hard") return 30;
  if (difficulty === "Medium") return 20;
  return 10;
};

const formatTime = (seconds) => {
  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const calculateDaysRemaining = (
  examDate
) => {
  const today = new Date();

  const exam = new Date(
    `${examDate}T00:00:00`
  );

  today.setHours(0, 0, 0, 0);

  const difference =
    exam.getTime() -
    today.getTime();

  return Math.max(
    0,
    Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    )
  );
};

function App() {
  const [subjects, setSubjects] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.subjects,
        DEFAULT_SUBJECTS
      )
    );

  const [studyHours, setStudyHours] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.studyHours,
        3
      )
    );

  const [completedTopics, setCompletedTopics] =
    useState(() =>
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

  const [studyDates, setStudyDates] =
    useState(() =>
      getStoredValue(
        STORAGE_KEYS.studyDates,
        []
      )
    );

  const [
    subjectStudiedSeconds,
    setSubjectStudiedSeconds,
  ] = useState(() =>
    getStoredValue(
      STORAGE_KEYS.subjectStudiedSeconds,
      {}
    )
  );

  const [selectedTopic, setSelectedTopic] =
    useState(null);

  const [timerSeconds, setTimerSeconds] =
    useState(25 * 60);

  const [isTimerRunning, setIsTimerRunning] =
    useState(false);

  /*
    Stores the topic key for the currently
    active 25-minute session.

    Example:
    coa-Functional Units
  */
  const activeSessionRef = useRef(null);

  const [showSubjectForm, setShowSubjectForm] =
    useState(false);

  const [editingSubjectId, setEditingSubjectId] =
    useState(null);

  const [subjectForm, setSubjectForm] =
    useState(getInitialForm());

  /* --------------------------------------------------
     LOCAL STORAGE
  -------------------------------------------------- */

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
      JSON.stringify(
        completedTopics
      )
    );
  }, [completedTopics]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completedSessions,
      JSON.stringify(
        completedSessions
      )
    );
  }, [completedSessions]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.studiedSeconds,
      JSON.stringify(
        studiedSeconds
      )
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
  }, [
    subjectStudiedSeconds,
  ]);

  /* --------------------------------------------------
     BASIC CALCULATIONS
  -------------------------------------------------- */

  const totalTopics = useMemo(() => {
    return subjects.reduce(
      (total, subject) =>
        total +
        subject.topics.length,
      0
    );
  }, [subjects]);

  const completedTopicCount =
    useMemo(() => {
      return Object.values(
        completedTopics
      ).filter(Boolean).length;
    }, [completedTopics]);

  const overallProgress =
    totalTopics > 0
      ? Math.round(
          (completedTopicCount /
            totalTopics) *
            100
        )
      : 0;

  const dailyGoalMinutes =
    studyHours * 60;

  const studiedMinutes =
    Math.floor(
      studiedSeconds / 60
    );

  const dailyGoalProgress =
    dailyGoalMinutes > 0
      ? Math.min(
          100,
          Math.round(
            (studiedMinutes /
              dailyGoalMinutes) *
              100
          )
        )
      : 0;

  const remainingMinutes =
    Math.max(
      0,
      dailyGoalMinutes -
        studiedMinutes
    );

  /* --------------------------------------------------
     STREAK
  -------------------------------------------------- */

  const currentStreak =
    useMemo(() => {
      if (!studyDates.length) {
        return 0;
      }

      const dates = new Set(
        studyDates
      );

      let streak = 0;

      const current = new Date();

      while (true) {
        const year =
          current.getFullYear();

        const month = String(
          current.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          current.getDate()
        ).padStart(2, "0");

        const key = `${year}-${month}-${day}`;

        if (!dates.has(key)) {
          break;
        }

        streak += 1;

        current.setDate(
          current.getDate() - 1
        );
      }

      return streak;
    }, [studyDates]);

  /* --------------------------------------------------
     SMART PRIORITY
  -------------------------------------------------- */

  const rankedSubjects =
    useMemo(() => {
      return subjects
        .map((subject) => {
          const completedCount =
            subject.topics.filter(
              (topic) =>
                completedTopics[
                  `${subject.id}-${topic}`
                ]
            ).length;

          const remainingTopics =
            subject.topics.length -
            completedCount;

          const daysRemaining =
            calculateDaysRemaining(
              subject.examDate
            );

          const urgencyScore =
            daysRemaining === 0
              ? 40
              : Math.min(
                  40,
                  40 /
                    Math.max(
                      daysRemaining,
                      1
                    )
                );

          const difficultyScore =
            getDifficultyScore(
              subject.difficulty
            );

          const topicLoadScore =
            subject.topics.length > 0
              ? (remainingTopics /
                  subject.topics
                    .length) *
                20
              : 0;

          const progressScore =
            subject.topics.length > 0
              ? (1 -
                  completedCount /
                    subject.topics
                      .length) *
                10
              : 0;

          const priority =
            Math.min(
              100,
              Math.round(
                urgencyScore +
                  difficultyScore +
                  topicLoadScore +
                  progressScore
              )
            );

          return {
            ...subject,
            completedCount,
            remainingTopics,
            daysRemaining,
            priority,
          };
        })
        .sort(
          (a, b) =>
            b.priority -
            a.priority
        );
    }, [
      subjects,
      completedTopics,
    ]);

  /* --------------------------------------------------
     ADAPTIVE RECOMMENDATION
  -------------------------------------------------- */

  const recommendation =
    useMemo(() => {
      for (const subject of rankedSubjects) {
        const topic =
          subject.topics.find(
            (item) =>
              !completedTopics[
                `${subject.id}-${item}`
              ]
          );

        if (topic) {
          return {
            subject,
            topic,
          };
        }
      }

      return null;
    }, [
      rankedSubjects,
      completedTopics,
    ]);

  /* --------------------------------------------------
     ADAPTIVE RECOVERY PLAN
  -------------------------------------------------- */

  const recoveryPlan =
    useMemo(() => {
      if (!rankedSubjects.length) {
        return [];
      }

      const availableMinutes =
        remainingMinutes;

      if (availableMinutes <= 0) {
        return [];
      }

      const subjectsWithTopics =
        rankedSubjects
          .filter(
            (subject) =>
              subject.remainingTopics >
              0
          )
          .slice(0, 3);

      if (
        !subjectsWithTopics.length
      ) {
        return [];
      }

      const totalPriority =
        subjectsWithTopics.reduce(
          (sum, subject) =>
            sum + subject.priority,
          0
        );

      let allocated = 0;

      return subjectsWithTopics.map(
        (subject, index) => {
          let minutes;

          if (
            index ===
            subjectsWithTopics.length -
              1
          ) {
            minutes =
              availableMinutes -
              allocated;
          } else {
            minutes = Math.round(
              (availableMinutes *
                subject.priority) /
                totalPriority
            );

            minutes = Math.max(
              15,
              minutes
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
        }
      );
    }, [
      rankedSubjects,
      remainingMinutes,
      completedTopics,
    ]);

  /* --------------------------------------------------
     TIMER
  -------------------------------------------------- */

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });

      /*
        Count ONLY actual running time.
      */
      setStudiedSeconds(
        (previous) =>
          previous + 1
      );

      /*
        Attribute actual study time
        to the selected subject.
      */
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

      /*
        Record today's study date.
      */
      setStudyDates((previous) => {
        const today =
          getTodayKey();

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
    }, 1000);

    return () =>
      clearInterval(interval);
  }, [
    isTimerRunning,
    selectedTopic,
  ]);

  /* --------------------------------------------------
     AUTOMATIC SESSION COMPLETION
  -------------------------------------------------- */

  useEffect(() => {
    if (
      timerSeconds !== 0 ||
      !activeSessionRef.current
    ) {
      return;
    }

    const sessionKey =
      activeSessionRef.current;

    /*
      Clear the ref immediately so
      this session can never be counted twice.
    */
    activeSessionRef.current = null;

    setIsTimerRunning(false);

    /*
      Count exactly ONE completed session.
    */
    setCompletedSessions(
      (previous) =>
        previous + 1
    );

    /*
      Mark the topic completed.
    */
    setCompletedTopics(
      (previous) => ({
        ...previous,
        [sessionKey]: true,
      })
    );
  }, [timerSeconds]);

  /* --------------------------------------------------
     START TOPIC
  -------------------------------------------------- */

  const startTopic = (
    subject,
    topic
  ) => {
    /*
      If another timer is running,
      don't accidentally move the
      current session to another topic.
    */
    if (isTimerRunning) {
      return;
    }

    const key = `${subject.id}-${topic}`;

    /*
      If already completed, don't start it.
    */
    if (completedTopics[key]) {
      return;
    }

    setSelectedTopic({
      subjectId: subject.id,
      subjectName:
        subject.name,
      difficulty:
        subject.difficulty,
      topic,
    });

    /*
      Store the exact session topic.
    */
    activeSessionRef.current =
      key;

    /*
      Always begin with a fresh
      25-minute session.
    */
    setTimerSeconds(25 * 60);

    setIsTimerRunning(true);
  };

  /* --------------------------------------------------
     PAUSE TIMER
  -------------------------------------------------- */

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  /* --------------------------------------------------
     RESUME TIMER
  -------------------------------------------------- */

  const resumeTimer = () => {
    if (
      !selectedTopic ||
      timerSeconds <= 0
    ) {
      return;
    }

    /*
      If the session was paused,
      preserve its topic.
    */
    if (!activeSessionRef.current) {
      activeSessionRef.current =
        `${selectedTopic.subjectId}-${selectedTopic.topic}`;
    }

    setIsTimerRunning(true);
  };

  /* --------------------------------------------------
     RESET TIMER
  -------------------------------------------------- */

  const resetTimer = () => {
    setIsTimerRunning(false);

    /*
      Cancels the current session.
      No progress is added.
    */
    activeSessionRef.current = null;

    setTimerSeconds(25 * 60);
  };

  /* --------------------------------------------------
     MANUAL SESSION BUTTON
  -------------------------------------------------- */

  const completeSession = () => {
    /*
      This button is intentionally disabled
      until the timer reaches 00:00.

      The automatic completion effect handles
      the actual session completion.
    */
    return;
  };

  /* --------------------------------------------------
     SUBJECT FORM
  -------------------------------------------------- */

  const openAddSubject = () => {
    setEditingSubjectId(null);

    setSubjectForm(
      getInitialForm()
    );

    setShowSubjectForm(true);
  };

  const openEditSubject = (
    subject
  ) => {
    setEditingSubjectId(
      subject.id
    );

    setSubjectForm({
      name: subject.name,
      examDate:
        subject.examDate,
      difficulty:
        subject.difficulty,
      topics:
        subject.topics.join("\n"),
    });

    setShowSubjectForm(true);
  };

  const cancelSubjectForm = () => {
    setShowSubjectForm(false);
    setEditingSubjectId(null);

    setSubjectForm(
      getInitialForm()
    );
  };

  const handleSubjectFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setSubjectForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const saveSubject = (event) => {
    event.preventDefault();

    const cleanName =
      subjectForm.name.trim();

    const cleanTopics =
      subjectForm.topics
        .split("\n")
        .map((topic) =>
          topic.trim()
        )
        .filter(Boolean);

    if (
      !cleanName ||
      !subjectForm.examDate ||
      cleanTopics.length === 0
    ) {
      alert(
        "Please enter subject name, exam date and at least one topic."
      );

      return;
    }

    if (editingSubjectId) {
      setSubjects(
        (previous) =>
          previous.map(
            (subject) =>
              subject.id ===
              editingSubjectId
                ? {
                    ...subject,
                    name: cleanName,
                    examDate:
                      subjectForm.examDate,
                    difficulty:
                      subjectForm.difficulty,
                    topics:
                      cleanTopics,
                  }
                : subject
          )
      );
    } else {
      const newSubject = {
        id: `subject-${Date.now()}`,
        name: cleanName,
        examDate:
          subjectForm.examDate,
        difficulty:
          subjectForm.difficulty,
        topics: cleanTopics,
      };

      setSubjects(
        (previous) => [
          ...previous,
          newSubject,
        ]
      );
    }

    cancelSubjectForm();
  };

  /* --------------------------------------------------
     DELETE SUBJECT
  -------------------------------------------------- */

  const deleteSubject = (
    subjectId
  ) => {
    const subject =
      subjects.find(
        (item) =>
          item.id === subjectId
      );

    if (!subject) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${subject.name}" from your study plan?`
      );

    if (!confirmed) {
      return;
    }

    /*
      Stop timer if the deleted subject
      is currently active.
    */
    if (
      selectedTopic?.subjectId ===
      subjectId
    ) {
      activeSessionRef.current = null;

      setSelectedTopic(null);
      setIsTimerRunning(false);
      setTimerSeconds(25 * 60);
    }

    setSubjects(
      (previous) =>
        previous.filter(
          (item) =>
            item.id !== subjectId
        )
    );

    setCompletedTopics(
      (previous) => {
        const updated = {
          ...previous,
        };

        Object.keys(updated).forEach(
          (key) => {
            if (
              key.startsWith(
                `${subjectId}-`
              )
            ) {
              delete updated[key];
            }
          }
        );

        return updated;
      }
    );

    setSubjectStudiedSeconds(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated[subjectId];

        return updated;
      }
    );

    if (
      editingSubjectId ===
      subjectId
    ) {
      cancelSubjectForm();
    }
  };

  /* --------------------------------------------------
     RESET DEMO DATA
  -------------------------------------------------- */

  const resetDemoData = () => {
    const confirmed =
      window.confirm(
        "Reset the planner to the original demo data? Your current progress will be removed."
      );

    if (!confirmed) {
      return;
    }

    activeSessionRef.current = null;

    setSubjects(
      DEFAULT_SUBJECTS
    );

    setStudyHours(3);
    setCompletedTopics({});
    setCompletedSessions(0);
    setStudiedSeconds(0);
    setStudyDates([]);
    setSubjectStudiedSeconds({});

    setSelectedTopic(null);
    setIsTimerRunning(false);
    setTimerSeconds(25 * 60);

    cancelSubjectForm();
  };

  /* --------------------------------------------------
     SUBJECT STUDY MINUTES
  -------------------------------------------------- */

  const getSubjectStudyMinutes = (
    subjectId
  ) => {
    return Math.floor(
      (subjectStudiedSeconds[
        subjectId
      ] || 0) / 60
    );
  };

  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */

  return (
    <div className="app">
      <header className="hero">
        <div className="container">
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
            An adaptive study planner
            that decides what you should
            study based on your exams,
            difficulty, progress and study
            history.
          </p>
        </div>
      </header>

      <main className="container">
        {/* AVAILABLE HOURS */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              TODAY'S AVAILABLE STUDY TIME
            </p>

            <h2>
              Tell the planner how much
              time you have today.
            </h2>

            <p>
              Your adaptive plan will use
              this time.
            </p>
          </div>

          <div className="hours-card">
            <div className="hours-control">
              <input
                type="range"
                min="1"
                max="12"
                value={studyHours}
                onChange={(event) =>
                  setStudyHours(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <div className="hours-number">
                <strong>
                  {studyHours}
                </strong>

                <span>hours</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>⏰</span>
                <strong>
                  {studyHours}
                </strong>
                <p>
                  Hours Available
                </p>
              </div>

              <div className="stat-card">
                <span>📚</span>
                <strong>
                  {subjects.length}
                </strong>
                <p>Subjects</p>
              </div>

              <div className="stat-card">
                <span>📝</span>
                <strong>
                  {completedSessions}
                </strong>
                <p>
                  Study Sessions
                </p>
              </div>

              <div className="stat-card">
                <span>🔥</span>
                <strong>
                  {currentStreak}
                </strong>
                <p>Day Streak</p>
              </div>

              <div className="stat-card">
                <span>🎯</span>
                <strong>
                  {overallProgress}%
                </strong>
                <p>
                  Topic Progress
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DAILY GOAL */}

        <section className="section">
          <div className="daily-goal-card">
            <div>
              <p className="section-label">
                🎯 DAILY GOAL
              </p>

              <h2>
                {studiedMinutes} /{" "}
                {dailyGoalMinutes}{" "}
                minutes
              </h2>
            </div>

            <div className="goal-progress">
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
            </div>
          </div>
        </section>

        {/* ANALYTICS */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              📊 STUDY ANALYTICS
            </p>

            <h2>
              Understand your study
              behavior and track your
              progress.
            </h2>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-icon">
                ⏱️
              </span>

              <h3>
                Today's Study
              </h3>

              <p>
                Actual study time vs daily
                goal
              </p>

              <strong>
                {studiedMinutes} min
              </strong>

              <div className="mini-progress">
                <div
                  style={{
                    width: `${dailyGoalProgress}%`,
                  }}
                />
              </div>

              <small>
                {studiedMinutes} min
                studied{" "}
                {dailyGoalMinutes} min
                goal
              </small>
            </div>

            <div className="analytics-card">
              <span className="analytics-icon">
                🔥
              </span>

              <h3>
                Current Streak
              </h3>

              <strong>
                {currentStreak} days
              </strong>

              <p>
                Keep studying every day to
                build your streak.
              </p>
            </div>

            <div className="analytics-card analytics-wide">
              <span className="analytics-icon">
                📚
              </span>

              <h3>
                Subject Study Time
              </h3>

              <p>
                See where your study time is
                going.
              </p>

              <div className="subject-time-list">
                {subjects.map(
                  (subject) => (
                    <div
                      className="subject-time-item"
                      key={subject.id}
                    >
                      <div>
                        <strong>
                          {subject.name}
                        </strong>

                        <span>
                          {
                            subject.difficulty
                          }
                        </span>
                      </div>

                      <strong>
                        {getSubjectStudyMinutes(
                          subject.id
                        )}{" "}
                        min
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="analytics-card analytics-wide">
              <span className="analytics-icon">
                🎯
              </span>

              <h3>
                Topic Completion
              </h3>

              <p>
                Track how much of each
                subject you have completed.
              </p>

              <div className="topic-analytics-list">
                {subjects.map(
                  (subject) => {
                    const completed =
                      subject.topics.filter(
                        (topic) =>
                          completedTopics[
                            `${subject.id}-${topic}`
                          ]
                      ).length;

                    const percentage =
                      subject.topics
                        .length > 0
                        ? Math.round(
                            (completed /
                              subject
                                .topics
                                .length) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        className="topic-analytics-item"
                        key={subject.id}
                      >
                        <div>
                          <strong>
                            {
                              subject.name
                            }
                          </strong>

                          <span>
                            {percentage}%
                          </span>
                        </div>

                        <small>
                          {completed} of{" "}
                          {
                            subject.topics
                              .length
                          }{" "}
                          topics completed
                        </small>

                        <div className="mini-progress">
                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="analytics-card">
              <span className="analytics-icon">
                📈
              </span>

              <h3>
                Planned vs Actual
              </h3>

              <p>
                Compare today's study
                behavior.
              </p>

              <div className="planned-actual">
                <div>
                  <span>
                    Planned
                  </span>

                  <strong>
                    {dailyGoalMinutes}{" "}
                    min
                  </strong>
                </div>

                <div>
                  <span>
                    Actual
                  </span>

                  <strong>
                    {studiedMinutes}{" "}
                    min
                  </strong>
                </div>

                <div>
                  <span>
                    Difference
                  </span>

                  <strong>
                    {studiedMinutes -
                      dailyGoalMinutes}{" "}
                    min
                  </strong>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <span className="analytics-icon">
                💡
              </span>

              <h3>
                Smart Insight
              </h3>

              {recommendation ? (
                <p>
                  Start with{" "}
                  <strong>
                    {
                      recommendation.topic
                    }
                  </strong>
                  . Your planner selected
                  it because{" "}
                  <strong>
                    {
                      recommendation
                        .subject.name
                    }
                  </strong>{" "}
                  has a high current
                  priority.
                </p>
              ) : (
                <p>
                  🎉 All topics are
                  completed. Great work!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SUBJECTS */}

        <section className="section">
          <div className="section-heading-row">
            <div>
              <p className="section-label">
                📚 MY SUBJECTS
              </p>

              <h2>
                Subjects currently in
                your study plan.
              </h2>
            </div>

            <button
              className="primary-button"
              onClick={
                openAddSubject
              }
            >
              + Add Subject
            </button>
          </div>

          {showSubjectForm && (
            <form
              className="subject-form"
              onSubmit={saveSubject}
            >
              <div className="subject-form-header">
                <h3>
                  {editingSubjectId
                    ? "Edit Subject"
                    : "Add New Subject"}
                </h3>

                <p>
                  Add the exam date,
                  difficulty and topics.
                </p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Subject Name
                  </label>

                  <input
                    name="name"
                    value={
                      subjectForm.name
                    }
                    onChange={
                      handleSubjectFormChange
                    }
                    placeholder="e.g. Operating Systems"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Exam Date
                  </label>

                  <input
                    type="date"
                    name="examDate"
                    value={
                      subjectForm.examDate
                    }
                    onChange={
                      handleSubjectFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Difficulty
                  </label>

                  <select
                    name="difficulty"
                    value={
                      subjectForm.difficulty
                    }
                    onChange={
                      handleSubjectFormChange
                    }
                  >
                    <option>
                      Easy
                    </option>

                    <option>
                      Medium
                    </option>

                    <option>
                      Hard
                    </option>
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label>
                    Topics
                  </label>

                  <textarea
                    name="topics"
                    value={
                      subjectForm.topics
                    }
                    onChange={
                      handleSubjectFormChange
                    }
                    placeholder="Enter one topic per line"
                  />

                  <small>
                    Example: Arrays,
                    Linked Lists, Trees
                    (one per line)
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    cancelSubjectForm
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingSubjectId
                    ? "Save Changes"
                    : "Add Subject"}
                </button>
              </div>
            </form>
          )}

          <div className="subject-grid">
            {subjects.map(
              (subject) => {
                const completed =
                  subject.topics.filter(
                    (topic) =>
                      completedTopics[
                        `${subject.id}-${topic}`
                      ]
                  ).length;

                const percentage =
                  subject.topics
                    .length > 0
                    ? Math.round(
                        (completed /
                          subject.topics
                            .length) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="subject-card"
                    key={subject.id}
                  >
                    <div className="subject-card-top">
                      <div>
                        <h3>
                          {
                            subject.name
                          }
                        </h3>

                        <p>
                          Exam{" "}
                          {
                            subject.examDate
                          }{" "}
                          •{" "}
                          {
                            subject.topics
                              .length
                          }{" "}
                          topics
                        </p>
                      </div>

                      <div className="subject-actions">
                        <button
                          className="icon-button edit-button"
                          onClick={() =>
                            openEditSubject(
                              subject
                            )
                          }
                          title="Edit subject"
                        >
                          ✏️
                        </button>

                        <button
                          className="icon-button delete-button"
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
                      className={`difficulty-badge ${subject.difficulty.toLowerCase()}`}
                    >
                      {
                        subject.difficulty
                      }
                    </span>

                    <div className="subject-progress">
                      <p>
                        <span>
                          {completed} /{" "}
                          {
                            subject
                              .topics
                              .length
                          }{" "}
                          topics
                        </span>

                        <strong>
                          {percentage}%
                        </strong>
                      </p>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* RECOMMENDATION */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              WHAT SHOULD I STUDY NOW?
            </p>
          </div>

          {recommendation ? (
            <div className="recommendation-card">
              <div className="recommendation-icon">
                🎯
              </div>

              <div className="recommendation-content">
                <p className="section-label">
                  ADAPTIVE RECOMMENDATION
                </p>

                <h2>
                  Study{" "}
                  {
                    recommendation.topic
                  }{" "}
                  now
                </h2>

                <h3>
                  {
                    recommendation
                      .subject.name
                  }
                </h3>

                <div className="why-box">
                  <h4>
                    🧠 Why this topic?
                  </h4>

                  <p>
                    <strong>
                      {
                        recommendation
                          .subject.name
                      }
                    </strong>{" "}
                    has an exam in{" "}
                    <strong>
                      {
                        recommendation
                          .subject
                          .daysRemaining
                      }
                    </strong>{" "}
                    day
                    {recommendation
                      .subject
                      .daysRemaining !==
                    1
                      ? "s"
                      : ""}
                    , it is a{" "}
                    <strong>
                      {
                        recommendation
                          .subject
                          .difficulty
                      }
                    </strong>{" "}
                    subject, and you still
                    have{" "}
                    <strong>
                      {
                        recommendation
                          .subject
                          .remainingTopics
                      }
                    </strong>{" "}
                    topics remaining.
                  </p>

                  <p>
                    The planner selected{" "}
                    <strong>
                      {
                        recommendation.topic
                      }
                    </strong>{" "}
                    because it is incomplete
                    and the subject currently
                    has a high study priority.
                  </p>
                </div>

                <div className="recommendation-details">
                  <span>
                    📅{" "}
                    {
                      recommendation
                        .subject
                        .daysRemaining
                    }{" "}
                    day
                    {recommendation
                      .subject
                      .daysRemaining !==
                    1
                      ? "s"
                      : ""}{" "}
                    until exam
                  </span>

                  <span>
                    📚{" "}
                    {
                      recommendation
                        .subject
                        .remainingTopics
                    }{" "}
                    topics remaining
                  </span>

                  <span>
                    🎯{" "}
                    {
                      recommendation
                        .subject
                        .difficulty
                    }{" "}
                    difficulty
                  </span>

                  <span>
                    ⏱️ 25 recommended
                    minutes
                  </span>
                </div>

                <button
                  className="primary-button"
                  disabled={
                    isTimerRunning
                  }
                  onClick={() =>
                    startTopic(
                      recommendation.subject,
                      recommendation.topic
                    )
                  }
                >
                  ▶ Start{" "}
                  {
                    recommendation.topic
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              🎉 All topics completed!
            </div>
          )}
        </section>

        {/* RECOVERY PLAN */}

        <section className="section">
          <div className="recovery-card">
            <div className="section-heading">
              <p className="section-label">
                🔄 ADAPTIVE RECOVERY
              </p>

              <h2>
                The planner adjusts your
                remaining study time based
                on how much you have actually
                studied today.
              </h2>
            </div>

            <div className="recovery-summary">
              <div>
                <span>⏱️</span>

                <strong>
                  {remainingMinutes}{" "}
                  min left
                </strong>
              </div>

              <div>
                <span>Planned</span>

                <strong>
                  {dailyGoalMinutes}{" "}
                  min
                </strong>
              </div>

              <div>
                <span>Studied</span>

                <strong>
                  {studiedMinutes}{" "}
                  min
                </strong>
              </div>

              <div>
                <span>Remaining</span>

                <strong>
                  {remainingMinutes}{" "}
                  min
                </strong>
              </div>
            </div>

            <div className="recovery-list">
              {recoveryPlan.length > 0 ? (
                recoveryPlan.map(
                  (item, index) => (
                    <div
                      className="recovery-item"
                      key={`${item.subject.id}-${item.topic}`}
                    >
                      <strong>
                        {index + 1}
                      </strong>

                      <div>
                        <h3>
                          {item.topic}
                        </h3>

                        <p>
                          {
                            item.subject
                              .name
                          }{" "}
                          •{" "}
                          {
                            item.subject
                              .difficulty
                          }
                        </p>
                      </div>

                      <span>
                        {item.minutes} min
                      </span>

                      <button
                        className="primary-button"
                        disabled={
                          isTimerRunning
                        }
                        onClick={() =>
                          startTopic(
                            item.subject,
                            item.topic
                          )
                        }
                      >
                        Start
                      </button>
                    </div>
                  )
                )
              ) : (
                <div className="empty-state">
                  🎉 No recovery plan
                  needed. You have completed
                  today's goal or all topics.
                </div>
              )}
            </div>

            <div className="smart-adjustment">
              💡{" "}
              <strong>
                Smart adjustment:
              </strong>{" "}
              Your remaining study time has
              been redistributed toward
              subjects with higher exam
              urgency, difficulty and
              unfinished topics.
            </div>
          </div>
        </section>

        {/* SMART PLANNER */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              🧠 SMART PLANNER
            </p>

            <h2>
              Priority ranking
            </h2>

            <p>
              Subjects are ranked using
              urgency, difficulty, remaining
              topics and study progress.
            </p>
          </div>

          <div className="ranking-list">
            {rankedSubjects.map(
              (subject, index) => (
                <div
                  className="ranking-card"
                  key={subject.id}
                >
                  <div className="ranking-number">
                    #{index + 1}
                  </div>

                  <div className="ranking-content">
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
                      •{" "}
                      {
                        subject.difficulty
                      }{" "}
                      •{" "}
                      {
                        subject.remainingTopics
                      }{" "}
                      topics remaining
                    </p>
                  </div>

                  <strong className="priority-score">
                    {subject.priority}
                  </strong>
                </div>
              )
            )}
          </div>
        </section>

        {/* TOPIC PROGRESS */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              📖 TOPIC PROGRESS
            </p>

            <h2>
              Mark topics as you complete
              them.
            </h2>
          </div>

          <div className="topic-progress-grid">
            {subjects.map(
              (subject) => {
                const completed =
                  subject.topics.filter(
                    (topic) =>
                      completedTopics[
                        `${subject.id}-${topic}`
                      ]
                  ).length;

                const percentage =
                  subject.topics
                    .length > 0
                    ? Math.round(
                        (completed /
                          subject.topics
                            .length) *
                          100
                      )
                    : 0;

                return (
                  <div
                    className="topic-card"
                    key={subject.id}
                  >
                    <div className="topic-card-heading">
                      <h3>
                        {subject.name}
                      </h3>

                      <span>
                        {percentage}%
                      </span>
                    </div>

                    <p>
                      {completed} of{" "}
                      {
                        subject.topics
                          .length
                      }{" "}
                      topics completed
                    </p>

                    <div className="topic-list">
                      {subject.topics.map(
                        (topic) => {
                          const key = `${subject.id}-${topic}`;

                          const completed =
                            Boolean(
                              completedTopics[
                                key
                              ]
                            );

                          return (
                            <button
                              key={topic}
                              className={`topic-chip ${
                                completed
                                  ? "completed"
                                  : ""
                              }`}
                              onClick={() =>
                                setCompletedTopics(
                                  (previous) => ({
                                    ...previous,
                                    [key]:
                                      !previous[
                                        key
                                      ],
                                  })
                                )
                              }
                            >
                              {completed
                                ? "✅"
                                : "⬜"}
                              {topic}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* TIMER */}

        <section className="section">
          <div className="timer-card">
            <div className="section-heading">
              <p className="section-label">
                ⏱️ FOCUS TIMER
              </p>

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
              {formatTime(
                timerSeconds
              )}
            </div>

            <div className="timer-controls">
              {!isTimerRunning &&
              timerSeconds > 0 ? (
                <button
                  className="primary-button"
                  onClick={() => {
                    if (!selectedTopic) {
                      if (
                        recommendation
                      ) {
                        startTopic(
                          recommendation.subject,
                          recommendation.topic
                        );
                      }

                      return;
                    }

                    resumeTimer();
                  }}
                >
                  ▶ Start
                </button>
              ) : isTimerRunning ? (
                <button
                  className="primary-button"
                  onClick={
                    pauseTimer
                  }
                >
                  ⏸ Pause
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled
                >
                  ✓ Session Complete
                </button>
              )}

              <button
                className="secondary-button"
                onClick={
                  resetTimer
                }
              >
                ↻ Reset
              </button>
            </div>

            <button
              className="session-complete-button"
              onClick={
                completeSession
              }
              disabled
            >
              ✓ Session completes
              automatically at 00:00
            </button>
          </div>
        </section>

        {/* TODAY'S TASKS */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              📋 TODAY'S STUDY TASKS
            </p>

            <h2>
              Recommended focus sessions
            </h2>
          </div>

          <div className="task-list">
            {recommendation ? (
              <div className="task-item">
                <span>🎯</span>

                <div className="planner-content">
                  <h3>
                    {
                      recommendation.topic
                    }
                  </h3>

                  <p>
                    {
                      recommendation
                        .subject.name
                    }{" "}
                    • 25 minutes
                  </p>
                </div>

                <button
                  className="primary-button"
                  disabled={
                    isTimerRunning
                  }
                  onClick={() =>
                    startTopic(
                      recommendation.subject,
                      recommendation.topic
                    )
                  }
                >
                  Start
                </button>
              </div>
            ) : (
              <div className="empty-state">
                🎉 All recommended tasks
                are completed.
              </div>
            )}
          </div>
        </section>

        {/* EXAMS */}

        <section className="section">
          <div className="section-heading">
            <p className="section-label">
              📅 UPCOMING EXAMS
            </p>

            <h2>
              Keep your deadlines visible.
            </h2>
          </div>

          <div className="exam-list">
            {rankedSubjects.map(
              (subject) => (
                <div
                  className="exam-item"
                  key={subject.id}
                >
                  <div>
                    <h3>
                      {subject.name}
                    </h3>

                    <p>
                      Exam:{" "}
                      {
                        subject.examDate
                      }
                    </p>
                  </div>

                  <strong>
                    {
                      subject.daysRemaining
                    }{" "}
                    day
                    {subject.daysRemaining !==
                    1
                      ? "s"
                      : ""}
                  </strong>
                </div>
              )
            )}
          </div>
        </section>

        {/* RESET */}

        <section className="reset-section">
          <button
            className="reset-button"
            onClick={
              resetDemoData
            }
          >
            🧹 Reset Demo Data
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;