import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [showForm, setShowForm] = useState(false)

  const [studyHours, setStudyHours] = useState(() => {
    const savedHours = localStorage.getItem('studyHours')
    return savedHours ? Number(savedHours) : 3
  })

  const [smartPlan, setSmartPlan] = useState([])

  const [completedSessions, setCompletedSessions] =
    useState(() => {
      const savedSessions =
        localStorage.getItem('completedSessions')

      return savedSessions
        ? JSON.parse(savedSessions)
        : []
    })

  // Total seconds actually studied today
  const [studiedSeconds, setStudiedSeconds] =
    useState(() => {
      const savedSeconds =
        localStorage.getItem('studiedSeconds')

      return savedSeconds
        ? Number(savedSeconds)
        : 0
    })

  const completedMinutes =
    Math.floor(studiedSeconds / 60)

  // Study streak state
  const [studyDates, setStudyDates] = useState(() => {
    const savedDates = localStorage.getItem('studyDates')
    return savedDates ? JSON.parse(savedDates) : []
  })

  const [streak, setStreak] = useState(0)

  const [subjects, setSubjects] = useState(() => {
    const savedSubjects =
      localStorage.getItem('subjects')

    if (savedSubjects) {
      return JSON.parse(savedSubjects)
    }

    return [
      {
        name: 'Data Structures',
        examDate: '2026-10-10',
        difficulty: 'Medium',
        topics: 8,
      },
      {
        name: 'Computer Organization',
        examDate: '2026-10-08',
        difficulty: 'Hard',
        topics: 10,
      },
      {
        name: 'Database Management',
        examDate: '2026-10-12',
        difficulty: 'Easy',
        topics: 6,
      },
    ]
  })

  const [formData, setFormData] = useState({
    name: '',
    examDate: '',
    difficulty: 'Medium',
    topics: '',
  })

  // Timer state
  const [activeTimer, setActiveTimer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] =
    useState(false)

  // Break timer state
  const [isBreak, setIsBreak] = useState(false)
  const [breakTimeLeft, setBreakTimeLeft] = useState(0)
  const [sessionStudiedSeconds, setSessionStudiedSeconds] = useState(0)

  // Save subjects
  useEffect(() => {
    localStorage.setItem(
      'subjects',
      JSON.stringify(subjects)
    )
  }, [subjects])

  // Save study hours
  useEffect(() => {
    localStorage.setItem(
      'studyHours',
      String(studyHours)
    )
  }, [studyHours])

  // Save completed sessions
  useEffect(() => {
    localStorage.setItem(
      'completedSessions',
      JSON.stringify(completedSessions)
    )
  }, [completedSessions])

  // Save actual study time
  useEffect(() => {
    localStorage.setItem(
      'studiedSeconds',
      String(studiedSeconds)
    )
  }, [studiedSeconds])

  // Save study dates
  useEffect(() => {
    localStorage.setItem(
      'studyDates',
      JSON.stringify(studyDates)
    )
  }, [studyDates])

  // Calculate the current consecutive study streak
  useEffect(() => {
    const dateSet = new Set(studyDates)
    let currentDate = new Date()
    let currentStreak = 0

    while (true) {
      const dateKey = currentDate
        .toISOString()
        .split('T')[0]

      if (!dateSet.has(dateKey)) {
        break
      }

      currentStreak += 1
      currentDate.setDate(
        currentDate.getDate() - 1
      )
    }

    setStreak(currentStreak)
  }, [studyDates])

  // Daily goal based on the user's available study time
  const dailyGoalMinutes = studyHours * 60

  const dailyGoalProgress =
    dailyGoalMinutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (completedMinutes /
              dailyGoalMinutes) *
              100
          )
        )

  // Study timer + live progress
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setStudiedSeconds((currentSeconds) => currentSeconds + 1)

      setSessionStudiedSeconds((currentSeconds) => {
        const nextSeconds = currentSeconds + 1

        if (nextSeconds >= 2 * 60) {
          setIsTimerRunning(false)
          setIsBreak(true)
          setBreakTimeLeft(10 * 60)
          return 0
        }

        return nextSeconds
      })

      const today = new Date().toISOString().split('T')[0]
      setStudyDates((currentDates) => {
        if (currentDates.includes(today)) return currentDates
        return [...currentDates, today]
      })

      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          setIsTimerRunning(false)
          if (activeTimer) {
            setCompletedSessions((currentSessions) => {
              if (currentSessions.includes(activeTimer)) return currentSessions
              return [...currentSessions, activeTimer]
            })
          }
          setSessionStudiedSeconds(0)
          return 0
        }
        return currentTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning, timeLeft, activeTimer])

  // Break countdown
  useEffect(() => {
    if (!isBreak || breakTimeLeft <= 0) return

    const breakTimer = setInterval(() => {
      setBreakTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          setIsBreak(false)
          return 0
        }
        return currentTime - 1
      })
    }, 1000)

    return () => clearInterval(breakTimer)
  }, [isBreak, breakTimeLeft])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (
      !formData.name ||
      !formData.examDate ||
      !formData.topics
    ) {
      alert('Please fill all the fields.')
      return
    }

    const newSubject = {
      name: formData.name,
      examDate: formData.examDate,
      difficulty: formData.difficulty,
      topics: Number(formData.topics),
    }

    setSubjects((currentSubjects) => [
      ...currentSubjects,
      newSubject,
    ])

    setFormData({
      name: '',
      examDate: '',
      difficulty: 'Medium',
      topics: '',
    })

    setShowForm(false)
    setSmartPlan([])
  }

  function calculatePriority(subject) {
    const today = new Date()
    const examDate = new Date(subject.examDate)

    const difference =
      examDate.getTime() - today.getTime()

    const daysRemaining = Math.max(
      1,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24)
      )
    )

    let difficultyScore = 1

    if (subject.difficulty === 'Medium') {
      difficultyScore = 2
    }

    if (subject.difficulty === 'Hard') {
      difficultyScore = 3
    }

    const priorityScore =
      (difficultyScore * subject.topics) /
      daysRemaining

    return {
      ...subject,
      daysRemaining,
      priorityScore,
    }
  }

  // Generate smart study plan
  function generateSmartPlan() {
    if (subjects.length === 0) {
      return
    }

    const scoredSubjects = subjects
      .map(calculatePriority)
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore
      )

    const totalMinutes =
      Number(studyHours) * 60

    const minimumMinutes = 30

    const totalPriority =
      scoredSubjects.reduce(
        (total, subject) =>
          total + subject.priorityScore,
        0
      )

    let plan = []

    if (
      totalMinutes >=
      minimumMinutes * scoredSubjects.length
    ) {
      const reservedMinutes =
        minimumMinutes *
        scoredSubjects.length

      const extraMinutes =
        totalMinutes - reservedMinutes

      let allocatedExtra = 0

      plan = scoredSubjects.map(
        (subject, index) => {
          let extra = 0

          if (index < scoredSubjects.length - 1) {
            extra = Math.round(
              (subject.priorityScore /
                totalPriority) *
                extraMinutes
            )

            allocatedExtra += extra
          } else {
            extra =
              extraMinutes -
              allocatedExtra
          }

          return {
            ...subject,
            allocatedMinutes:
              minimumMinutes + extra,
          }
        }
      )
    } else {
      let allocatedTotal = 0

      plan = scoredSubjects.map(
        (subject, index) => {
          let allocatedMinutes = 0

          if (index < scoredSubjects.length - 1) {
            allocatedMinutes = Math.round(
              (subject.priorityScore /
                totalPriority) *
                totalMinutes
            )

            allocatedTotal += allocatedMinutes
          } else {
            allocatedMinutes =
              totalMinutes - allocatedTotal
          }

          return {
            ...subject,
            allocatedMinutes,
          }
        }
      )
    }

    setSmartPlan(plan)
  }

  function toggleComplete(subjectName) {
    setCompletedSessions((currentSessions) => {
      if (currentSessions.includes(subjectName)) {
        return currentSessions.filter(
          (name) => name !== subjectName
        )
      }

      return [
        ...currentSessions,
        subjectName,
      ]
    })
  }

  // Start timer
  function startTimer(subject) {
    setIsBreak(false)
    setBreakTimeLeft(0)
    setActiveTimer(subject.name)
    setTimeLeft(subject.allocatedMinutes * 60)
    setSessionStudiedSeconds(0)
    setIsTimerRunning(true)
  }

  function pauseTimer() {
    setIsTimerRunning(false)
  }

  function resumeTimer() {
    if (timeLeft > 0 && !isBreak) {
      setIsTimerRunning(true)
    }
  }

  function skipBreak() {
    setIsBreak(false)
    setBreakTimeLeft(0)
    setSessionStudiedSeconds(0)
  }

  function resetTimer() {
    const currentSubject = smartPlan.find(
      (subject) => subject.name === activeTimer
    )

    if (currentSubject) {
      setTimeLeft(currentSubject.allocatedMinutes * 60)
    }

    setIsBreak(false)
    setBreakTimeLeft(0)
    setSessionStudiedSeconds(0)
    setIsTimerRunning(false)
  }

  // Format timer
  function formatTime(seconds) {
    const minutes = Math.floor(
      seconds / 60
    )

    const remainingSeconds =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(remainingSeconds).padStart(
      2,
      '0'
    )}`
  }

  // Smart recommendation
  const recommendedSubject =
    smartPlan.length > 0
      ? smartPlan[0]
      : null

  // Total planned study minutes
  const totalPlannedMinutes =
    smartPlan.reduce(
      (total, subject) =>
        total + subject.allocatedMinutes,
      0
    )

  // Progress percentage
  const progress =
    totalPlannedMinutes === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (completedMinutes /
              totalPlannedMinutes) *
              100
          )
        )

  return (
    <div className="app">

      {/* Header */}

      <header className="header">

        <div>
          <h1>Smart Study Planner</h1>

          <p>
            Plan smarter. Study better. Achieve more.
          </p>
        </div>

      </header>

      {/* Available Study Time */}

      <section className="settings-card">

        <div>
          <h2>
            ⏰ Today's Available Study Time
          </h2>

          <p>
            Tell the planner how much time you
            have today.
          </p>
        </div>

        <div className="hours-input">

          <input
            type="number"
            min="1"
            max="12"
            value={studyHours}
            onChange={(event) =>
              setStudyHours(
                Number(event.target.value)
              )
            }
          />

          <span>hours</span>

        </div>

      </section>

      {/* Summary */}

      <section className="summary-grid">

        <div className="summary-card">

          <span className="card-icon">
            📚
          </span>

          <h3>Today's Study</h3>

          <strong>
            {studyHours} Hours
          </strong>

          <p>
            Available today
          </p>

        </div>

        <div className="summary-card">

          <span className="card-icon">
            ⏰
          </span>

          <h3>Upcoming Exams</h3>

          <strong>
            {subjects.length}
          </strong>

          <p>
            Exams coming soon
          </p>

        </div>

        <div className="summary-card">

          <span className="card-icon">
            📈
          </span>

          <h3>Today's Progress</h3>

          <strong>
            {progress}%
          </strong>

          <p>
            {completedMinutes} /{' '}
            {totalPlannedMinutes} min completed
          </p>

        </div>

        <div className="summary-card">

          <span className="card-icon">
            🔥
          </span>

          <h3>Study Streak</h3>

          <strong>
            {streak} {streak === 1 ? 'Day' : 'Days'}
          </strong>

          <p>
            {streak > 0
              ? 'Keep the streak going!'
              : 'Start studying to begin'}
          </p>

        </div>

        <div className="summary-card">

          <span className="card-icon">
            🎯
          </span>

          <h3>Daily Goal</h3>

          <strong>
            {dailyGoalProgress}%
          </strong>

          <p>
            {completedMinutes} / {dailyGoalMinutes} min
          </p>

        </div>

      </section>

      {/* My Subjects */}

      <section className="plan-section">

        <div className="section-heading">

          <div>
            <h2>My Subjects</h2>

            <p>
              Add the subjects you need to study.
            </p>
          </div>

          <button
            type="button"
            className="smart-button"
            onClick={() =>
              setShowForm((current) => !current)
            }
          >
            {showForm
              ? '✕ Close'
              : '➕ Add Subject'}
          </button>

        </div>

        {showForm && (

          <form
            className="subject-form"
            onSubmit={handleSubmit}
          >

            <label>
              Subject Name

              <input
                type="text"
                name="name"
                placeholder="Example: Mathematics"
                value={formData.name}
                onChange={handleChange}
              />

            </label>

            <label>
              Exam Date

              <input
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
              />

            </label>

            <label>
              Difficulty

              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >

                <option value="Easy">
                  Easy
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Hard">
                  Hard
                </option>

              </select>

            </label>

            <label>
              Number of Topics

              <input
                type="number"
                name="topics"
                min="1"
                placeholder="Example: 8"
                value={formData.topics}
                onChange={handleChange}
              />

            </label>

            <button
              type="submit"
              className="save-button"
            >
              Save Subject
            </button>

          </form>

        )}

        <div className="exam-list">

          {subjects.map((subject) => (

            <div
              className="exam-card"
              key={subject.name}
            >

              <div>

                <h3>
                  {subject.name}
                </h3>

                <p>
                  Exam: {subject.examDate}
                  {' • '}
                  {subject.topics} topics
                </p>

              </div>

              <span
                className={
                  subject.difficulty === 'Hard'
                    ? 'high-priority'
                    : subject.difficulty ===
                        'Medium'
                      ? 'medium-priority'
                      : 'low-priority'
                }
              >
                {subject.difficulty}
              </span>

            </div>

          ))}

        </div>

      </section>

      {/* Smart Recommendation */}

      {recommendedSubject && (

        <section className="recommendation-card">

          <div className="recommendation-icon">
            🎯
          </div>

          <div className="recommendation-content">

            <p className="recommendation-label">
              SMART RECOMMENDATION
            </p>

            <h2>
              Study {recommendedSubject.name} First
            </h2>

            <p>
              This is currently your highest-priority
              subject based on your exam date,
              difficulty and number of topics.
            </p>

            <div className="recommendation-details">

              <span>
                📅 Exam in{' '}
                {recommendedSubject.daysRemaining}{' '}
                days
              </span>

              <span>
                📚 {recommendedSubject.topics}{' '}
                topics
              </span>

              <span>
                🎯 {recommendedSubject.difficulty}{' '}
                difficulty
              </span>

              <span>
                ⏱️ {recommendedSubject.allocatedMinutes}{' '}
                minutes
              </span>

            </div>

            <button
              type="button"
              className="recommendation-button"
              onClick={() =>
                startTimer(recommendedSubject)
              }
            >
              ▶ Start Recommended Session
            </button>

          </div>

        </section>

      )}

      {/* Smart Planner */}

      <section className="plan-section">

        <div className="section-heading">

          <div>
            <h2>
              🧠 Smart Planner
            </h2>

            <p>
              Automatically distributes your
              study time based on priority.
            </p>
          </div>

          <button
            type="button"
            className="smart-button"
            onClick={generateSmartPlan}
          >
            ✨ Generate Smart Plan
          </button>

        </div>

        {smartPlan.length > 0 && (

          <div className="smart-result">

            <h3>
              Your Personalized Study Plan
            </h3>

            <p>
              Priority is calculated using exam
              urgency, difficulty and remaining
              topics.
            </p>

            {smartPlan.map(
              (subject, index) => (

                <div
                  className="smart-result-item"
                  key={subject.name}
                >

                  <div>

                    <strong>
                      {index + 1}.{' '}
                      {subject.name}
                    </strong>

                    <p>
                      Exam in{' '}
                      {subject.daysRemaining}{' '}
                      days
                      {' • '}
                      {subject.topics} topics
                      {' • '}
                      {subject.difficulty}
                    </p>

                    <p className="priority-reason">
                      {subject.daysRemaining <= 2
                        ? '🔥 High Priority — Exam soon'
                        : subject.daysRemaining <= 4
                          ? '⚡ Medium Priority — Exam approaching'
                          : '🟢 Lower Priority — Exam later'}
                      {' • '}
                      {subject.difficulty === 'Hard'
                        ? 'Hard difficulty'
                        : subject.difficulty === 'Medium'
                          ? 'Medium difficulty'
                          : 'Easy difficulty'}
                      {' • '}
                      {subject.topics} topics
                    </p>

                  </div>

                  <div className="allocated-time">

                    <strong>
                      {subject.allocatedMinutes}{' '}
                      min
                    </strong>

                    <span>
                      study time
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* Study Timer */}

      {activeTimer && (
        <section className="plan-section timer-section">
          {isBreak ? (
            <>
              <h2>☕ Smart Break</h2>
              <p>You've been studying for 50 minutes. Take a short break before continuing.</p>

              <div className="timer-display">
                {formatTime(breakTimeLeft)}
              </div>

              <p>Relax, stretch, drink some water, and come back refreshed.</p>

              <div className="timer-buttons">
                <button type="button" className="start-button" onClick={skipBreak}>
                  ▶ Continue Studying
                </button>
                <button type="button" className="reset-button" onClick={skipBreak}>
                  Skip Break
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>⏱️ Study Timer</h2>
              <p>Currently studying:</p>
              <h3>{activeTimer}</h3>

              <div className="timer-display">
                {formatTime(timeLeft)}
              </div>

              <div className="timer-buttons">
                {isTimerRunning ? (
                  <button type="button" className="pause-button" onClick={pauseTimer}>
                    ⏸ Pause
                  </button>
                ) : (
                  <button type="button" className="start-button" onClick={resumeTimer}>
                    ▶ Resume
                  </button>
                )}

                <button type="button" className="reset-button" onClick={resetTimer}>
                  🔄 Reset
                </button>
              </div>

              {timeLeft === 0 && (
                <p className="timer-complete">🎉 Study session completed!</p>
              )}
            </>
          )}
        </section>
      )}

      {/* Start Studying */}

      {smartPlan.length > 0 && (

        <section className="plan-section">

          <div className="section-heading">

            <div>
              <h2>
                📖 Start Studying
              </h2>

              <p>
                Start a focused study session
                from your personalized plan.
              </p>
            </div>

          </div>

          <div className="study-list">

            {smartPlan.map((subject) => (

              <div
                className="study-item"
                key={subject.name}
              >

                <div className="study-left">

                  <div className="subject-icon">
                    📚
                  </div>

                  <div>

                    <h3>
                      {subject.name}
                    </h3>

                    <p>
                      {subject.allocatedMinutes}{' '}
                      minutes planned
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="start-button"
                  onClick={() =>
                    startTimer(subject)
                  }
                >
                  ▶ Start Study
                </button>

              </div>

            ))}

          </div>

        </section>

      )}

      {/* Today's Study Tasks */}

      <section className="plan-section">

        <div className="section-heading">

          <div>
            <h2>
              Today's Study Tasks
            </h2>

            <p>
              Mark sessions complete as you
              study.
            </p>
          </div>

        </div>

        <div className="study-list">

          {subjects.map((subject) => (

            <div
              className="study-item"
              key={subject.name}
            >

              <div className="study-left">

                <div className="subject-icon">
                  📚
                </div>

                <div>

                  <h3>
                    {subject.name}
                  </h3>

                  <p>
                    {subject.topics} topics
                  </p>

                </div>

              </div>

              <button
                type="button"
                className={
                  completedSessions.includes(
                    subject.name
                  )
                    ? 'complete-button completed'
                    : 'complete-button'
                }
                onClick={() =>
                  toggleComplete(
                    subject.name
                  )
                }
              >
                {completedSessions.includes(
                  subject.name
                )
                  ? '✓'
                  : '○'}
              </button>

            </div>

          ))}

        </div>

      </section>

      {/* Upcoming Exams */}

      <section className="exam-section">

        <h2>
          Upcoming Exams
        </h2>

        <div className="exam-list">

          {subjects.map((subject) => (

            <div
              className="exam-card"
              key={subject.name}
            >

              <div>

                <h3>
                  {subject.name}
                </h3>

                <p>
                  Exam on {subject.examDate}
                </p>

              </div>

              <span
                className={
                  subject.difficulty === 'Hard'
                    ? 'high-priority'
                    : subject.difficulty ===
                        'Medium'
                      ? 'medium-priority'
                      : 'low-priority'
                }
              >
                {subject.difficulty}
              </span>

            </div>

          ))}

        </div>

      </section>

    </div>
  )
}

export default App