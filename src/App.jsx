import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   DEMO DATA
========================================================= */

const demoSteps = [
  {
    title: "Possible Accident Detected",
    message: "AI detected an abnormal emergency pattern.",
    type: "danger",
    icon: "🚨",
  },
  {
    title: "AI Analysing Emergency",
    message: "Emergency severity analysis in progress.",
    type: "ai",
    icon: "🤖",
  },
  {
    title: "Severity 92% — High Risk",
    message: "Incident classified as HIGH PRIORITY.",
    type: "danger",
    icon: "⚠️",
  },
  {
    title: "Ambulance AMB-11 Assigned",
    message: "Nearest available ambulance assigned.",
    type: "info",
    icon: "🚑",
  },
  {
    title: "Checking Hospital Availability",
    message: "AI checking nearest emergency departments.",
    type: "ai",
    icon: "🤖",
  },
  {
    title: "Metro Super Specialty Full",
    message: "No emergency bed currently available.",
    type: "danger",
    icon: "🏥",
  },
  {
    title: "AI Selecting Alternate Hospital",
    message: "Finding the next best hospital.",
    type: "ai",
    icon: "🧠",
  },
  {
    title: "Government General Hospital Selected",
    message: "Emergency bed confirmed.",
    type: "success",
    icon: "🏥",
  },
  {
    title: "Blood Requirement Checked",
    message: "Blood inventory verification completed.",
    type: "info",
    icon: "🩸",
  },
  {
    title: "Police Notified",
    message: "Nearest police response unit alerted.",
    type: "warning",
    icon: "👮",
  },
  {
    title: "Family Notified",
    message: "Emergency contact notification sent.",
    type: "success",
    icon: "📱",
  },
  {
    title: "Ambulance En Route",
    message: "AMB-11 is moving towards incident location.",
    type: "info",
    icon: "🚑",
  },
  {
    title: "Emergency Successfully Coordinated",
    message: "All emergency services synchronized.",
    type: "success",
    icon: "✅",
  },
];

const ambulances = [
  {
    id: "AMB-11",
    location: "Rajpur Road",
    status: "En Route",
    eta: "04 min",
  },
  {
    id: "AMB-07",
    location: "ISBT",
    status: "Available",
    eta: "--",
  },
  {
    id: "AMB-19",
    location: "Clock Tower",
    status: "At Hospital",
    eta: "--",
  },
  {
    id: "AMB-04",
    location: "Prem Nagar",
    status: "Available",
    eta: "--",
  },
];

const hospitals = [
  {
    name: "Government General Hospital",
    beds: 12,
    icu: 4,
    status: "Available",
  },
  {
    name: "Metro Super Specialty",
    beds: 0,
    icu: 0,
    status: "Full",
  },
  {
    name: "City Care Hospital",
    beds: 8,
    icu: 2,
    status: "Available",
  },
  {
    name: "Doon Medical Centre",
    beds: 5,
    icu: 1,
    status: "Limited",
  },
];

const bloodStock = [
  { group: "A+", units: 24 },
  { group: "A-", units: 7 },
  { group: "B+", units: 31 },
  { group: "B-", units: 5 },
  { group: "O+", units: 42 },
  { group: "O-", units: 8 },
  { group: "AB+", units: 14 },
  { group: "AB-", units: 3 },
];

const policeUnits = [
  {
    id: "PCR-21",
    location: "Rajpur Road",
    status: "Responding",
  },
  {
    id: "PCR-08",
    location: "Clock Tower",
    status: "Available",
  },
  {
    id: "PCR-14",
    location: "ISBT",
    status: "Available",
  },
  {
    id: "PCR-32",
    location: "Prem Nagar",
    status: "Patrolling",
  },
];

/* =========================================================
   APP
========================================================= */

function App() {
  const [activeTab, setActiveTab] = useState("control");
  const [activeSection, setActiveSection] = useState("overview");

  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [sosActive, setSosActive] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(10);

  const [emergencyStage, setEmergencyStage] =
    useState("Standby");

  const [incidentCount, setIncidentCount] = useState(12);

  const toastIdRef = useRef(0);

  const audioContextRef = useRef(null);
  const buzzerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const sosTimersRef = useRef([]);

  /* =========================================================
     AUDIO / BUZZER
  ========================================================= */

  const playBeep = useCallback(
    (duration = 180, frequency = 850) => {
      try {
        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
          0.0001,
          ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.25,
          ctx.currentTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + duration / 1000
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();

        oscillator.stop(
          ctx.currentTime + duration / 1000 + 0.02
        );
      } catch (error) {
        console.log("Audio error:", error);
      }
    },
    []
  );

  const startEmergencyBuzzer = useCallback(() => {
    if (buzzerIntervalRef.current) {
      clearInterval(buzzerIntervalRef.current);
    }

    playBeep(500, 950);

    buzzerIntervalRef.current = setInterval(() => {
      playBeep(500, 950);
    }, 750);
  }, [playBeep]);

  const stopEmergencyBuzzer = useCallback(() => {
    if (buzzerIntervalRef.current) {
      clearInterval(buzzerIntervalRef.current);
      buzzerIntervalRef.current = null;
    }
  }, []);

  /* =========================================================
     TOAST
  ========================================================= */

  const showToast = useCallback((item) => {
    const id = ++toastIdRef.current;

    setToasts((prev) => [
      ...prev,
      {
        ...item,
        id,
      },
    ].slice(-4));

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.filter((toast) => toast.id !== id)
      );
    }, 4500);
  }, []);

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const addNotification = useCallback(
    (item, popup = true) => {
      const notification = {
        ...item,
        id:
          Date.now() +
          Math.random(),

        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setNotifications((prev) =>
        [notification, ...prev].slice(0, 15)
      );

      if (popup) {
        showToast(notification);
      }
    },
    [showToast]
  );

  /* =========================================================
     SOS
  ========================================================= */

  const triggerSOS = useCallback(() => {
    if (sosActive) {
      playBeep(300, 700);
      return;
    }

    /* Browser audio permission starts from user click */
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioContext) {
        if (!audioContextRef.current) {
          audioContextRef.current =
            new AudioContext();
        }

        if (
          audioContextRef.current.state ===
          "suspended"
        ) {
          audioContextRef.current.resume();
        }
      }
    } catch (error) {
      console.log(error);
    }

    setActiveTab("citizen");
    setSosActive(true);
    setSosTriggered(false);
    setSosCountdown(10);
    setEmergencyStage("SOS Countdown");
    setIncidentCount((count) => count + 1);

    playBeep(250, 1000);

    addNotification(
      {
        title: "SOS BUTTON ACTIVATED",
        message:
          "Emergency countdown started — 10 seconds.",
        type: "danger",
        icon: "🚨",
      },
      true
    );

    let remaining = 10;

    countdownIntervalRef.current =
      window.setInterval(() => {
        remaining -= 1;

        setSosCountdown(remaining);

        if (remaining > 0) {
          playBeep(
            180,
            900 + remaining * 20
          );
        }

        if (remaining <= 0) {
          clearInterval(
            countdownIntervalRef.current
          );

          countdownIntervalRef.current = null;

          setSosTriggered(true);
          setEmergencyStage(
            "Emergency Confirmed"
          );

          /* MAIN EMERGENCY BUZZER */
          startEmergencyBuzzer();

          addNotification(
            {
              title:
                "SOS EMERGENCY CONFIRMED",
              message:
                "Emergency confirmed. Control Room and response teams notified.",
              type: "danger",
              icon: "🚨",
            },
            true
          );

          const ambulanceTimer =
            window.setTimeout(() => {
              setEmergencyStage(
                "Ambulance Dispatched"
              );

              addNotification(
                {
                  title:
                    "AMBULANCE DISPATCHED",
                  message:
                    "Nearest ambulance AMB-11 has been assigned.",
                  type: "info",
                  icon: "🚑",
                },
                true
              );
            }, 1500);

          const policeTimer =
            window.setTimeout(() => {
              addNotification(
                {
                  title: "POLICE ALERTED",
                  message:
                    "Nearest police response unit has been notified.",
                  type: "warning",
                  icon: "👮",
                },
                true
              );
            }, 3000);

          const hospitalTimer =
            window.setTimeout(() => {
              setEmergencyStage(
                "Hospital Coordination"
              );

              addNotification(
                {
                  title: "HOSPITAL ALERT",
                  message:
                    "Emergency department has been notified.",
                  type: "success",
                  icon: "🏥",
                },
                true
              );
            }, 4500);

          sosTimersRef.current = [
            ambulanceTimer,
            policeTimer,
            hospitalTimer,
          ];
        }
      }, 1000);
  }, [
    sosActive,
    playBeep,
    startEmergencyBuzzer,
    addNotification,
  ]);

  /* =========================================================
     RESET SOS
  ========================================================= */

  const resetSOS = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(
        countdownIntervalRef.current
      );

      countdownIntervalRef.current = null;
    }

    sosTimersRef.current.forEach((timer) =>
      clearTimeout(timer)
    );

    sosTimersRef.current = [];

    stopEmergencyBuzzer();

    setSosActive(false);
    setSosTriggered(false);
    setSosCountdown(10);
    setEmergencyStage("Standby");

    addNotification(
      {
        title: "SOS RESET",
        message:
          "Emergency simulation has been reset.",
        type: "info",
        icon: "↩️",
      },
      true
    );
  }, [stopEmergencyBuzzer, addNotification]);

  /* =========================================================
     AUTO DEMO
  ========================================================= */

  const startDemo = useCallback(() => {
    setDemoRunning(false);
    setDemoStep(0);
    setNotifications([]);
    setToasts([]);
    setActiveTab("control");
    setActiveSection("overview");

    window.setTimeout(() => {
      setDemoRunning(true);
    }, 150);
  }, []);

  const stopDemo = useCallback(() => {
    setDemoRunning(false);
  }, []);

  useEffect(() => {
    if (!demoRunning) return;

    const step = demoSteps[demoStep];

    if (!step) {
      setDemoRunning(false);
      return;
    }

    addNotification(step, true);

    const timer = window.setTimeout(() => {
      if (
        demoStep >=
        demoSteps.length - 1
      ) {
        setDemoRunning(false);
      } else {
        setDemoStep(
          (current) => current + 1
        );
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [
    demoRunning,
    demoStep,
    addNotification,
  ]);

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(
          countdownIntervalRef.current
        );
      }

      if (buzzerIntervalRef.current) {
        clearInterval(
          buzzerIntervalRef.current
        );
      }

      sosTimersRef.current.forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="app-shell">

      <div className="background-grid"></div>
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoRunning={demoRunning}
        startDemo={startDemo}
        stopDemo={stopDemo}
      />

      <div className="app-layout">

        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <main className="main-content">

          {activeTab === "citizen" ? (
            <CitizenDashboard
              sosActive={sosActive}
              sosTriggered={sosTriggered}
              sosCountdown={sosCountdown}
              emergencyStage={emergencyStage}
              triggerSOS={triggerSOS}
              resetSOS={resetSOS}
            />
          ) : (
            <ControlRoom
              activeSection={activeSection}
              notifications={notifications}
              demoRunning={demoRunning}
              demoStep={demoStep}
              startDemo={startDemo}
              stopDemo={stopDemo}
              incidentCount={incidentCount}
              sosActive={sosActive}
            />
          )}

        </main>
      </div>

      <ToastStack toasts={toasts} />

    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  activeTab,
  setActiveTab,
  demoRunning,
  startDemo,
  stopDemo,
}) {
  return (
    <header className="top-header">

      <div className="brand-area">

        <div className="brand-icon">
          🚨
        </div>

        <div>
          <div className="brand-title">
            ONE INDIA
            <span> EMERGENCY GRID</span>
          </div>

          <div className="brand-subtitle">
            AI Powered National Emergency Coordination
          </div>
        </div>

      </div>

      <div className="header-right">

        <div className="system-status">
          <span className="status-dot"></span>
          ALL SYSTEMS OPERATIONAL
        </div>

        <div className="tab-switch">

          <button
            className={
              activeTab === "control"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("control")
            }
          >
            🖥️ Control Room
          </button>

          <button
            className={
              activeTab === "citizen"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("citizen")
            }
          >
            📱 Citizen App
          </button>

        </div>

        <button
          className={
            demoRunning
              ? "demo-button running"
              : "demo-button"
          }
          onClick={
            demoRunning
              ? stopDemo
              : startDemo
          }
        >
          {demoRunning
            ? "⏹ Stop Demo"
            : "▶ Auto Demo"}
        </button>

      </div>
    </header>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  activeSection,
  setActiveSection,
}) {
  const items = [
    ["overview", "◈", "Overview"],
    ["incidents", "🚨", "Live Incidents"],
    ["ambulances", "🚑", "Ambulances"],
    ["hospitals", "🏥", "Hospitals"],
    ["blood", "🩸", "Blood Network"],
    ["police", "👮", "Police Response"],
    ["analytics", "📊", "Analytics"],
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-label">
        COMMAND CENTER
      </div>

      <nav>
        {items.map(
          ([id, icon, label]) => (
            <button
              key={id}
              className={
                activeSection === id
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                setActiveSection(id)
              }
            >
              <span className="sidebar-icon">
                {icon}
              </span>

              <span>{label}</span>

              {activeSection === id && (
                <span className="active-line"></span>
              )}
            </button>
          )
        )}
      </nav>

      <div className="sidebar-bottom">

        <div className="network-card">

          <div className="network-title">
            NETWORK STATUS
          </div>

          <div className="network-row">
            <span>Emergency Grid</span>
            <strong>ONLINE</strong>
          </div>

          <div className="network-bar">
            <div></div>
          </div>

          <div className="network-small">
            99.98% availability
          </div>

        </div>

      </div>

    </aside>
  );
}

/* =========================================================
   CONTROL ROOM
========================================================= */

function ControlRoom({
  activeSection,
  notifications,
  demoRunning,
  demoStep,
  startDemo,
  stopDemo,
  incidentCount,
  sosActive,
}) {
  if (activeSection === "incidents") {
    return (
      <SectionView
        title="Live Incidents"
        subtitle="Real-time emergency incidents"
      >
        <IncidentCards />
      </SectionView>
    );
  }

  if (activeSection === "ambulances") {
    return (
      <SectionView
        title="Ambulance Network"
        subtitle="Live ambulance availability"
      >
        <AmbulanceCards />
      </SectionView>
    );
  }

  if (activeSection === "hospitals") {
    return (
      <SectionView
        title="Hospital Network"
        subtitle="Emergency bed and ICU availability"
      >
        <HospitalCards />
      </SectionView>
    );
  }

  if (activeSection === "blood") {
    return (
      <SectionView
        title="Blood Network"
        subtitle="Live blood inventory monitoring"
      >
        <BloodCards />
      </SectionView>
    );
  }

  if (activeSection === "police") {
    return (
      <SectionView
        title="Police Response"
        subtitle="Emergency response units"
      >
        <PoliceCards />
      </SectionView>
    );
  }

  if (activeSection === "analytics") {
    return (
      <SectionView
        title="Emergency Analytics"
        subtitle="AI-powered emergency performance"
      >
        <AnalyticsView />
      </SectionView>
    );
  }

  return (
    <div className="dashboard">

      <PageHeading
        title="National Emergency Command Center"
        subtitle="AI-powered real-time emergency coordination dashboard"
        live
      />

      <StatsGrid incidentCount={incidentCount} />

      <div className="demo-notification-grid">

        <AutoDemoPanel
          demoRunning={demoRunning}
          demoStep={demoStep}
          startDemo={startDemo}
          stopDemo={stopDemo}
        />

        <NotificationPanel
          notifications={notifications}
        />

      </div>

      <div className="main-grid">

        <EmergencyMap sosActive={sosActive} />

        <AIIntelligence
          sosActive={sosActive}
        />

      </div>

      <div className="bottom-grid">

        <ActiveEmergency sosActive={sosActive} />

        <ResponseTimeline />

      </div>

    </div>
  );
}

/* =========================================================
   PAGE HEADING
========================================================= */

function PageHeading({
  title,
  subtitle,
  live,
}) {
  return (
    <div className="page-heading">

      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {live && (
        <div className="live-badge">
          <span></span>
          LIVE SYSTEM
        </div>
      )}

    </div>
  );
}

/* =========================================================
   STATS
========================================================= */

function StatsGrid({
  incidentCount,
}) {
  const stats = [
    [
      "ACTIVE INCIDENTS",
      incidentCount,
      "↑ 8.4%",
      "🚨",
      "danger",
    ],
    [
      "AMBULANCES ONLINE",
      "48",
      "92% available",
      "🚑",
      "blue",
    ],
    [
      "HOSPITALS CONNECTED",
      "126",
      "98% online",
      "🏥",
      "green",
    ],
    [
      "AVG RESPONSE TIME",
      "08:42",
      "↓ 12.8%",
      "⚡",
      "purple",
    ],
  ];

  return (
    <div className="stats-grid">

      {stats.map(
        (stat, index) => (
          <div
            className="stat-card"
            key={index}
          >

            <div
              className={`stat-icon ${stat[4]}`}
            >
              {stat[3]}
            </div>

            <div className="stat-info">
              <div className="stat-label">
                {stat[0]}
              </div>

              <div className="stat-value">
                {stat[1]}
              </div>

              <div className="stat-change">
                {stat[2]}
              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   AUTO DEMO
========================================================= */

function AutoDemoPanel({
  demoRunning,
  demoStep,
  startDemo,
  stopDemo,
}) {
  const progress =
    demoRunning
      ? ((demoStep + 1) /
          demoSteps.length) *
        100
      : 0;

  return (
    <section className="glass-card demo-panel">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            AI SIMULATION
          </div>

          <h2>Emergency Auto Demo</h2>
        </div>

        <div
          className={
            demoRunning
              ? "live-pill running"
              : "live-pill"
          }
        >
          <span></span>
          {demoRunning
            ? "RUNNING"
            : "READY"}
        </div>

      </div>

      <div className="demo-visual">

        <div className="demo-icon">
          {demoRunning
            ? demoSteps[demoStep]?.icon
            : "🤖"}
        </div>

        <div className="demo-content">

          <div className="demo-step-label">
            STEP{" "}
            {demoRunning
              ? demoStep + 1
              : 0}{" "}
            / {demoSteps.length}
          </div>

          <h3>
            {demoRunning
              ? demoSteps[demoStep]
                  ?.title
              : "Start Emergency Simulation"}
          </h3>

          <p>
            {demoRunning
              ? demoSteps[demoStep]
                  ?.message
              : "Watch AI coordinate ambulance, hospital, police and family response."}
          </p>

        </div>

      </div>

      <div className="demo-progress">
        <div
          style={{
            width: `${progress}%`,
          }}
        ></div>
      </div>

      <button
        className={
          demoRunning
            ? "demo-control stop"
            : "demo-control"
        }
        onClick={
          demoRunning
            ? stopDemo
            : startDemo
        }
      >
        {demoRunning
          ? "⏹ Stop Simulation"
          : "▶ Start Emergency Demo"}
      </button>

    </section>
  );
}

/* =========================================================
   NOTIFICATION PANEL
========================================================= */

function NotificationPanel({
  notifications,
}) {
  return (
    <section className="glass-card notification-panel">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            REAL TIME
          </div>

          <h2>Live Notifications</h2>
        </div>

        <div className="notification-live">
          <span></span>
          LIVE
        </div>

      </div>

      <div className="notification-list">

        {notifications.length === 0 ? (
          <div className="empty-notification">
            <div>🔔</div>
            <p>
              Waiting for emergency events...
            </p>
          </div>
        ) : (
          notifications.map(
            (notification) => (
              <NotificationItem
                key={notification.id}
                notification={
                  notification
                }
              />
            )
          )
        )}

      </div>

    </section>
  );
}

/* =========================================================
   NOTIFICATION ITEM
========================================================= */

function NotificationItem({
  notification,
}) {
  return (
    <div
      className={`notification-item ${notification.type}`}
    >

      <div className="notification-icon">
        {notification.icon}
      </div>

      <div className="notification-body">

        <div className="notification-title">
          {notification.title}
        </div>

        <div className="notification-message">
          {notification.message}
        </div>

        <div className="notification-time">
          {notification.time}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   MAP
========================================================= */

function EmergencyMap({
  sosActive,
}) {
  return (
    <section className="glass-card map-card">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            LIVE GEO INTELLIGENCE
          </div>

          <h2>Emergency Response Map</h2>
        </div>

        <div className="map-location">
          🇮🇳 INDIA GRID
        </div>

      </div>

      <div className="map">

        <div className="map-grid"></div>

        <div className="road road-one"></div>
        <div className="road road-two"></div>
        <div className="road road-three"></div>

        <div className="map-marker marker-one">
          <span>🚨</span>
          <label>INC-2041</label>
        </div>

        <div className="map-marker marker-two">
          <span>🚑</span>
          <label>AMB-11</label>
        </div>

        <div className="map-marker marker-three">
          <span>🏥</span>
          <label>HOSP-17</label>
        </div>

        <div className="map-marker marker-four">
          <span>👮</span>
          <label>PCR-21</label>
        </div>

        {sosActive && (
          <div className="sos-map-marker">
            🚨
          </div>
        )}

        <div className="map-overlay">

          <div>
            <span className="map-dot red"></span>
            Emergency
          </div>

          <div>
            <span className="map-dot blue"></span>
            Ambulance
          </div>

          <div>
            <span className="map-dot green"></span>
            Hospital
          </div>

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   AI INTELLIGENCE
========================================================= */

function AIIntelligence({
  sosActive,
}) {
  return (
    <section className="glass-card ai-card">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            ARTIFICIAL INTELLIGENCE
          </div>

          <h2>AI Intelligence</h2>
        </div>

        <div className="ai-status">
          <span></span>
          ACTIVE
        </div>

      </div>

      <div className="ai-score">

        <div className="score-ring">
          <div>
            <strong>
              {sosActive ? "98" : "94"}%
            </strong>
            <span>Confidence</span>
          </div>
        </div>

        <div className="score-text">
          <h3>
            {sosActive
              ? "Critical Emergency"
              : "Emergency Prediction"}
          </h3>

          <p>
            AI continuously analyses
            incident severity, location,
            response availability and
            hospital capacity.
          </p>
        </div>

      </div>

      <div className="ai-metrics">

        <div>
          <span>Severity</span>
          <strong>
            {sosActive
              ? "CRITICAL"
              : "HIGH"}
          </strong>
        </div>

        <div>
          <span>Priority</span>
          <strong>P1</strong>
        </div>

        <div>
          <span>Prediction</span>
          <strong>08:42</strong>
        </div>

      </div>

    </section>
  );
}

/* =========================================================
   ACTIVE EMERGENCY
========================================================= */

function ActiveEmergency({
  sosActive,
}) {
  return (
    <section className="glass-card active-emergency">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            PRIORITY INCIDENT
          </div>

          <h2>Active Emergency</h2>
        </div>

        <div className="critical-badge">
          CRITICAL
        </div>

      </div>

      <div className="incident-header">

        <div className="incident-id">
          INC-2041
        </div>

        <div className="incident-type">
          {sosActive
            ? "Citizen SOS Emergency"
            : "Road Accident"}
        </div>

      </div>

      <div className="incident-details">

        <div>
          <span>📍</span>
          Rajpur Road, Dehradun
        </div>

        <div>
          <span>⏱️</span>
          04:28 Response Timer
        </div>

        <div>
          <span>🚑</span>
          AMB-11 Assigned
        </div>

        <div>
          <span>🏥</span>
          Govt General Hospital
        </div>

      </div>

      <div className="severity-meter">

        <div className="severity-top">
          <span>AI Severity</span>
          <strong>
            {sosActive
              ? "98%"
              : "92%"}
          </strong>
        </div>

        <div className="severity-track">
          <div
            style={{
              width: sosActive
                ? "98%"
                : "92%",
            }}
          ></div>
        </div>

      </div>

    </section>
  );
}

/* =========================================================
   RESPONSE TIMELINE
========================================================= */

function ResponseTimeline() {
  const events = [
    [
      "Emergency detected",
      "22:41:04",
      "danger",
    ],
    [
      "AI severity calculated",
      "22:41:07",
      "ai",
    ],
    [
      "Ambulance assigned",
      "22:41:15",
      "info",
    ],
    [
      "Hospital confirmed",
      "22:41:31",
      "success",
    ],
    [
      "Police notified",
      "22:41:42",
      "warning",
    ],
  ];

  return (
    <section className="glass-card timeline-card">

      <div className="card-heading">

        <div>
          <div className="eyebrow">
            EVENT HISTORY
          </div>

          <h2>Response Timeline</h2>
        </div>

      </div>

      <div className="timeline">

        {events.map(
          (event, index) => (
            <div
              className="timeline-item"
              key={index}
            >

              <div
                className={`timeline-dot ${event[2]}`}
              ></div>

              <div className="timeline-content">
                <strong>
                  {event[0]}
                </strong>

                <span>
                  {event[1]}
                </span>
              </div>

            </div>
          )
        )}

      </div>

    </section>
  );
}

/* =========================================================
   CITIZEN DASHBOARD
========================================================= */

function CitizenDashboard({
  sosActive,
  sosTriggered,
  sosCountdown,
  emergencyStage,
  triggerSOS,
  resetSOS,
}) {
  return (
    <div className="citizen-dashboard">

      <PageHeading
        title="Citizen Emergency App"
        subtitle="One-tap access to India's emergency response network"
      />

      <div className="citizen-grid">

        <section className="glass-card citizen-sos-card">

          <div className="citizen-card-header">

            <div>
              <div className="eyebrow">
                EMERGENCY ASSISTANCE
              </div>

              <h2>Need Immediate Help?</h2>

              <p>
                Press the SOS button to
                alert the emergency
                response network.
              </p>
            </div>

            <div className="citizen-location">
              📍 Location Ready
            </div>

          </div>

          <div className="sos-section">

            {!sosActive ? (
              <>
                <div className="sos-ring">

                  <button
                    className="sos-button"
                    onClick={triggerSOS}
                  >
                    <span className="sos-icon">
                      🚨
                    </span>

                    <span>SOS</span>

                    <small>
                      EMERGENCY
                    </small>
                  </button>

                </div>

                <p className="sos-hint">
                  Press only in case of emergency
                </p>
              </>
            ) : (
              <div className="sos-active-panel">

                <div className="sos-active-header">

                  <span className="live-dot"></span>

                  SOS SYSTEM ACTIVE

                </div>

                {!sosTriggered ? (
                  <>
                    <div className="sos-countdown">

                      <div className="countdown-label">
                        EMERGENCY ACTIVATION IN
                      </div>

                      <div className="countdown-number">
                        {sosCountdown}
                      </div>

                      <div className="countdown-unit">
                        SECONDS
                      </div>

                    </div>

                    <div className="countdown-bar">

                      <div
                        className="countdown-progress"
                        style={{
                          width:
                            `${
                              (sosCountdown /
                                10) *
                              100
                            }%`,
                        }}
                      ></div>

                    </div>

                    <p className="sos-warning">
                      🔊 Emergency buzzer will
                      activate automatically
                    </p>

                  </>
                ) : (
                  <div className="sos-confirmed">

                    <div className="confirmed-icon">
                      🚨
                    </div>

                    <h2>
                      SOS ACTIVATED
                    </h2>

                    <p>
                      {emergencyStage}
                    </p>

                    <div className="response-status">

                      <div>
                        <span>📍</span>
                        Location Shared
                      </div>

                      <div>
                        <span>🚑</span>
                        Ambulance Dispatched
                      </div>

                      <div>
                        <span>👮</span>
                        Police Alerted
                      </div>

                      <div>
                        <span>🏥</span>
                        Hospital Alerted
                      </div>

                    </div>

                    <button
                      className="stop-sos-button"
                      onClick={resetSOS}
                    >
                      RESET EMERGENCY SIMULATION
                    </button>

                  </div>
                )}

              </div>
            )}

          </div>

        </section>

        <section className="glass-card citizen-status-card">

          <div className="eyebrow">
            EMERGENCY RESPONSE
          </div>

          <h2>Response Network</h2>

          <div className="citizen-response-list">

            <ResponseBox
              icon="🚑"
              title="Ambulance"
              text="48 Units Online"
              status="READY"
            />

            <ResponseBox
              icon="🏥"
              title="Hospitals"
              text="126 Connected"
              status="ONLINE"
            />

            <ResponseBox
              icon="👮"
              title="Police"
              text="Emergency Units"
              status="READY"
            />

            <ResponseBox
              icon="🩸"
              title="Blood Network"
              text="Live Inventory"
              status="ACTIVE"
            />

          </div>

          <div className="safety-message">

            <div>🛡️</div>

            <div>
              <strong>
                Your safety comes first
              </strong>

              <p>
                Once SOS is confirmed,
                relevant emergency
                services are automatically
                coordinated.
              </p>
            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   RESPONSE BOX
========================================================= */

function ResponseBox({
  icon,
  title,
  text,
  status,
}) {
  return (
    <div className="response-box">

      <div className="response-box-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>

      <small>{status}</small>

    </div>
  );
}

/* =========================================================
   SECTION VIEW
========================================================= */

function SectionView({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="dashboard">

      <PageHeading
        title={title}
        subtitle={subtitle}
        live
      />

      {children}

    </div>
  );
}

/* =========================================================
   INCIDENT CARDS
========================================================= */

function IncidentCards() {
  const incidents = [
    {
      id: "INC-2041",
      type: "Road Accident",
      location: "Rajpur Road",
      severity: "Critical",
      time: "2 min ago",
    },
    {
      id: "INC-2039",
      type: "Medical Emergency",
      location: "Clock Tower",
      severity: "High",
      time: "5 min ago",
    },
    {
      id: "INC-2038",
      type: "Fire Alert",
      location: "ISBT",
      severity: "Medium",
      time: "8 min ago",
    },
  ];

  return (
    <div className="data-grid">

      {incidents.map(
        (incident) => (
          <div
            className="data-card"
            key={incident.id}
          >

            <div className="data-card-top">

              <span className="data-icon">
                🚨
              </span>

              <span
                className={`severity-tag ${incident.severity.toLowerCase()}`}
              >
                {incident.severity}
              </span>

            </div>

            <h3>{incident.type}</h3>

            <p>
              📍 {incident.location}
            </p>

            <div className="data-card-bottom">
              <span>{incident.id}</span>
              <span>{incident.time}</span>
            </div>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   AMBULANCE CARDS
========================================================= */

function AmbulanceCards() {
  return (
    <div className="data-grid">

      {ambulances.map(
        (ambulance) => (
          <div
            className="data-card"
            key={ambulance.id}
          >

            <div className="data-card-top">

              <span className="data-icon">
                🚑
              </span>

              <span
                className={
                  ambulance.status ===
                  "Available"
                    ? "availability available"
                    : "availability busy"
                }
              >
                {ambulance.status}
              </span>

            </div>

            <h3>{ambulance.id}</h3>

            <p>
              📍 {ambulance.location}
            </p>

            <div className="data-card-bottom">
              <span>ETA</span>
              <strong>{ambulance.eta}</strong>
            </div>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   HOSPITAL CARDS
========================================================= */

function HospitalCards() {
  return (
    <div className="data-grid">

      {hospitals.map(
        (hospital) => (
          <div
            className="data-card"
            key={hospital.name}
          >

            <div className="data-card-top">

              <span className="data-icon">
                🏥
              </span>

              <span
                className={`availability ${
                  hospital.status ===
                  "Available"
                    ? "available"
                    : "busy"
                }`}
              >
                {hospital.status}
              </span>

            </div>

            <h3>{hospital.name}</h3>

            <div className="hospital-stats">

              <div>
                <strong>
                  {hospital.beds}
                </strong>
                <span>General Beds</span>
              </div>

              <div>
                <strong>
                  {hospital.icu}
                </strong>
                <span>ICU Beds</span>
              </div>

            </div>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   BLOOD CARDS
========================================================= */

function BloodCards() {
  return (
    <div className="blood-grid">

      {bloodStock.map(
        (blood) => (
          <div
            className="blood-card"
            key={blood.group}
          >

            <div className="blood-symbol">
              🩸
            </div>

            <div className="blood-group">
              {blood.group}
            </div>

            <div className="blood-units">
              {blood.units} units
            </div>

            <div className="blood-progress">
              <div
                style={{
                  width: `${Math.min(
                    blood.units * 2,
                    100
                  )}%`,
                }}
              ></div>
            </div>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   POLICE
========================================================= */

function PoliceCards() {
  return (
    <div className="data-grid">

      {policeUnits.map(
        (unit) => (
          <div
            className="data-card"
            key={unit.id}
          >

            <div className="data-card-top">

              <span className="data-icon">
                👮
              </span>

              <span className="availability available">
                {unit.status}
              </span>

            </div>

            <h3>{unit.id}</h3>

            <p>
              📍 {unit.location}
            </p>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsView() {
  return (
    <div className="analytics-grid">

      <div className="analytics-card">

        <div className="analytics-number">
          08:42
        </div>

        <div className="analytics-label">
          Average Response Time
        </div>

        <div className="analytics-chart">
          <div style={{ height: "40%" }}></div>
          <div style={{ height: "60%" }}></div>
          <div style={{ height: "45%" }}></div>
          <div style={{ height: "75%" }}></div>
          <div style={{ height: "90%" }}></div>
          <div style={{ height: "80%" }}></div>
          <div style={{ height: "100%" }}></div>
        </div>

      </div>

      <div className="analytics-card">

        <div className="analytics-number">
          96.8%
        </div>

        <div className="analytics-label">
          Emergency Coordination Success
        </div>

        <div className="circle-stat">
          96.8%
        </div>

      </div>

      <div className="analytics-card">

        <div className="analytics-number">
          1,284
        </div>

        <div className="analytics-label">
          Incidents Resolved
        </div>

        <div className="big-check">
          ✓
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   TOAST STACK
========================================================= */

function ToastStack({
  toasts,
}) {
  return (
    <div className="toast-stack">

      {toasts.map(
        (toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
          >

            <div className="toast-icon">
              {toast.icon}
            </div>

            <div className="toast-content">

              <strong>
                {toast.title}
              </strong>

              <p>
                {toast.message}
              </p>

              <small>
                JUST NOW
              </small>

            </div>

            <div className="toast-pulse"></div>

          </div>
        )
      )}

    </div>
  );
}

export default App;