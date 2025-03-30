import { useState, useEffect, useRef } from "react";
import { Maximize, X, PieChart } from "lucide-react";
import Confetti from "react-confetti";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  Bell,
  Clock,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

import './index.css';

export default function TaskSurfers() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Personal");
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [activeTab, setActiveTab] = useState("Tasks");
  const [showConfetti, setShowConfetti] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [lastDistraction, setLastDistraction] = useState(null);
  const [totalDistractionTime, setTotalDistractionTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);

  // Initialize the session timer when the component mounts
  useEffect(() => {
    // Handle visibility change (browser tab changes)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page/app
        setIsVisible(false);
        setLastDistraction(new Date());
      } else {
        // User returned to the page/app
        setIsVisible(true);

        if (lastDistraction) {
          const timeAway = Math.round((new Date() - lastDistraction) / 1000);
          setTotalDistractionTime((prev) => prev + timeAway);
          setDistractionCount((prev) => prev + 1);
        }
      }
    };

    // Session timer - runs regardless of which internal tab is active
    const sessionTimer = setInterval(() => {
      if (isVisible) {
        // Only increment time when tab is visible
        const elapsed = Math.round((new Date() - sessionStartTime) / 1000);
        setCurrentSessionTime((prev) => elapsed);
      }
    }, 1000);

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(sessionTimer);
    };
  }, [lastDistraction, sessionStartTime, isVisible]);

  const priorityColors = {
    High: "bg-red-200 border-red-500",
    Medium: "bg-yellow-200 border-yellow-500",
    Low: "bg-green-200 border-green-500",
  };

  const chartColors = {
    High: "#EF4444",
    Medium: "#F59E0B",
    Low: "#10B981",
    completed: "#3B82F6",
    added: "#6366F1",
    Personal: "#8B5CF6",
    Assignment: "#EC4899",
    Projects: "#F97316",
    Exams: "#0EA5E9",
  };

  // Log task activity
  const logActivity = (action, taskData) => {
    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString();

    setActivityLog((prevLog) => [
      ...prevLog,
      {
        id: Date.now(),
        action,
        taskData,
        timestamp,
        formattedDate,
      },
    ]);
  };

  const addTask = () => {
    if (newTask.trim() === "") return;

    const newTaskData = {
      id: Date.now(),
      text: newTask,
      completed: false,
      priority: priority,
      category: category,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTaskData]);
    logActivity("added", newTaskData);

    setNewTask("");
    setPriority("Medium");
    setCategory("Personal");
  };
  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };

          if (!task.completed) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 9000);
            logActivity("completed", updatedTask);
          } else {
            logActivity("uncompleted", updatedTask);
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    logActivity("deleted", taskToDelete);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditedText(task.text);
  };

  const saveEdit = (id) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, text: editedText };
          logActivity("edited", updatedTask);
          return updatedTask;
        }
        return task;
      })
    );
    setEditingTask(null);
  };

  // Get statistics data
  const getStatisticsData = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Priority breakdown
    const priorityCounts = {
      High: tasks.filter((task) => task.priority === "High").length,
      Medium: tasks.filter((task) => task.priority === "Medium").length,
      Low: tasks.filter((task) => task.priority === "Low").length,
    };

    // Category breakdown
    const categoryCounts = {};
    tasks.forEach((task) => {
      if (!categoryCounts[task.category]) {
        categoryCounts[task.category] = 0;
      }
      categoryCounts[task.category]++;
    });

    // Activity by date
    const activityByDate = {};

    // Initialize with the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toLocaleDateString();
      last7Days.push(formattedDate);
      activityByDate[formattedDate] = {
        date: formattedDate,
        completed: 0,
        added: 0,
      };
    }

    // Populate with actual data
    activityLog.forEach((log) => {
      if (!activityByDate[log.formattedDate]) {
        activityByDate[log.formattedDate] = {
          date: log.formattedDate,
          completed: 0,
          added: 0,
        };
      }

      if (log.action === "added") {
        activityByDate[log.formattedDate].added++;
      } else if (log.action === "completed") {
        activityByDate[log.formattedDate].completed++;
      }
    });

    // Convert to array for charts, include only the last 7 days
    const activityData = last7Days.map(
      (date) => activityByDate[date] || { date, completed: 0, added: 0 }
    );

    return {
      totalTasks,
      completedTasks,
      incompleteTasks,
      completionRate,
      priorityCounts,
      categoryCounts,
      activityData,
    };
  };

  const renderTaskList = () => (
    <div className="h-full flex flex-col">
      {showConfetti && <Confetti numberOfPieces={1000} recycle={false} />}

      <div className="flex flex-col gap-3 mb-4 p-2 bg-white rounded-lg shadow-sm">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 text-sm"
        />
        {isExpanded && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">✅ Low</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Assignment">📚 Assignment</option>
              <option value="Projects">🚀 Projects</option>
              <option value="Exams">📝 Exams</option>
              <option value="Personal">🏠 Personal</option>
            </select>
          </div>
        )}

        <div className="w-full flex justify-center">
          <img
            src="/AddTask.png"
            alt="Add Task"
            className="cursor-pointer h-9 w-auto hover:scale-105 transition-transform"
            onClick={addTask}
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm hover:bg-gray-50 transition ${priorityColors[task.priority]
              }`}
          >
            <div className="flex-1 min-w-0">
              {editingTask === task.id ? (
                <input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              ) : (
                <div className="space-y-1">
                  <p
                    className={`text-sm truncate ${task.completed
                      ? "line-through text-red-600 decoration-black decoration-2" // Dark red for completed tasks
                      : "text-gray-800 font-medium" // Bright yellow for active tasks
                      }`}


                  >
                    {task.text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-white/50 rounded-full border">
                      {task.category}
                    </span>
                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-2">
              {editingTask === task.id ? (
                <button
                  disabled={editedText.trim() === ""}
                  onClick={() => saveEdit(task.id)}
                  className={`text-xs font-semibold transition ${editedText.trim() === ""
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700"
                    }`}
                >
                  Save
                </button>
              ) : (
                <img
                  src="/Pencil.png"
                  alt="Edit task"
                  className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                  onClick={() => startEditing(task)}
                />
              )}
              <img
                src="/Tick.png"
                alt="Complete task"
                className={`w-6 h-6 cursor-pointer transition-opacity  ${task.completed ? "opacity-100" : "opacity-60 hover:opacity-80"
                  }`}
                onClick={() => toggleTask(task.id)}
              />
              <img
                src="/Cross.png"
                alt="Delete task"
                className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => deleteTask(task.id)}
              />

            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  // Updated Statistics styling
  const renderStatistics = () => {
    const stats = getStatisticsData();

    return (
      <div className="h-full flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 mb-1">
              Total Tasks
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalTasks}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 mb-1">
              Completed
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.completedTasks}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 mb-1">
              Completion
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats.completionRate}%
            </p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex-1">
          <h3 className="text-xs font-medium text-gray-600 mb-3">
            Weekly Activity
          </h3>
          <div className="h-[200px]">
            {stats.activityData.some(
              (day) => day.added > 0 || day.completed > 0
            ) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.activityData}
                  margin={{ top: 5, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.split("/")[0]}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={25} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={chartColors.completed}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="added"
                    name="Added"
                    fill={chartColors.added}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <PieChart size={32} className="mb-2 opacity-50" />
                <p className="text-xs">No activity data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 mb-2">
              Priority Breakdown
            </h3>
            <div className="space-y-1">
              {Object.entries(stats.priorityCounts).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${priorityColors[priority].split(" ")[0]
                        }`}
                    />
                    <span className="text-gray-700">{priority}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xs font-medium text-gray-600 mb-2">
              Categories
            </h3>
            <div className="space-y-1">
              {Object.entries(stats.categoryCounts).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{category}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reset session function that doesn't get triggered by tab changes
  const resetSession = () => {
    setSessionStartTime(new Date());
    setCurrentSessionTime(0);
    setDistractionCount(0);
    setTotalDistractionTime(0);
  };

  return isExpanded ? (
    <div
      className="p-5 bg-[#94cefb] shadow-2xl rounded-2xl border border-gray-300 w-[390px] h-[700px] flex flex-col"
      style={{ fontFamily: "Lilita One" }}
    >
      <div className="flex justify-end items-center mb-4">
        {/* <h2 className="text-xl" style={{ fontFamily: "Lilita One" }}>Expanded View</h2> */}
        <X
          className="text-gray-500 cursor-pointer hover:text-gray-700"
          onClick={() => setIsExpanded(false)}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 bg-gray-100 rounded-lg shadow-inner mb-4">
        {/* Tasks Tab */}
        <div style={{ display: activeTab === "Tasks" ? "block" : "none" }}>
          {renderTaskList()}
        </div>

        {/* Statistics Tab */}
        <div style={{ display: activeTab === "Statistics" ? "block" : "none" }}>
          {renderStatistics()}
        </div>

        {/* Focus Monitor Tab */}
        <div style={{ display: activeTab === "Focus Monitor" ? "block" : "none" }}>
          <DistractionAlertWidget
            currentSessionTime={currentSessionTime}
            isVisible={isVisible}
            distractionCount={distractionCount}
            totalDistractionTime={totalDistractionTime}
            resetSession={resetSession}
          />
        </div>

        {/* Focus Zone Tab */}
        <div className="h-full" style={{ display: activeTab === "Focus Zone" ? "block" : "none", transform: 'scale(0.85)' }}>
          <div className="flex justify-center items-center h-full">
            <SubwaySurfers />
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Bottom */}
      <div className="grid grid-cols-2 gap-2">
        {["Tasks", "Statistics", "Focus Monitor", "Focus Zone"].map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-300 ${activeTab === tab
              ? "bg-[#266eab] text-white shadow-md"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div
      className="relative p-5 bg-[#94cefb] shadow-2xl rounded-2xl border border-gray-300 w-85"
      style={{ fontFamily: "Lilita One" }}
    >
      <div className="flex justify-between align-center">
        <h2 className="text-2xl mb-4 text-white drop-shadow-xl">
          Task Manager
        </h2>
        <Maximize
          className="text-gray-500 cursor-pointer hover:text-gray-700 transition"
          onClick={() => setIsExpanded(true)}
        />
      </div>

      {/* Task input area */}
      <div className="flex flex-col gap-3 mb-4 p-2 bg-white rounded-lg shadow-sm">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 text-sm"
        />

        <div className="w-full flex justify-center">
          <img
            src="/AddTask.png"
            alt="Add Task"
            className="cursor-pointer h-9 w-auto hover:scale-105 transition-transform"
            onClick={addTask}
          />
        </div>
      </div>

      {/* Task list with fixed height and scrolling */}
      <div className="max-h-40 overflow-y-auto pr-1">
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between p-3 border-l-4 rounded-lg shadow-sm hover:bg-gray-50 transition ${priorityColors[task.priority]
                }`}
            >
              <div className="flex-1 min-w-0">
                {editingTask === task.id ? (
                  <input
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                ) : (
                  <div className="space-y-1">
                    <p
                      className={`text-sm truncate ${task.completed
                        ? "line-through text-red-600 decoration-black decoration-2"
                        : "text-gray-800 font-medium"
                        }`}
                    >
                      {task.text}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-white/50 rounded-full border">
                        {task.category}
                      </span>
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-2">
                {editingTask === task.id ? (
                  <button
                    disabled={editedText.trim() === ""}
                    onClick={() => saveEdit(task.id)}
                    className={`text-xs font-semibold transition ${editedText.trim() === ""
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:text-blue-700"
                      }`}
                  >
                    Save
                  </button>
                ) : (
                  <img
                    src="/Pencil.png"
                    alt="Edit task"
                    className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                    onClick={() => startEditing(task)}
                  />
                )}
                <img
                  src="/Tick.png"
                  alt="Complete task"
                  className={`w-6 h-6 cursor-pointer transition-opacity ${task.completed ? "opacity-100" : "opacity-60 hover:opacity-80"
                    }`}
                  onClick={() => toggleTask(task.id)}
                />
                <img
                  src="/Cross.png"
                  alt="Delete task"
                  className="w-6 h-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                  onClick={() => deleteTask(task.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showConfetti && <Confetti numberOfPieces={1000} recycle={false} />}
    </div>
  );
}

const DistractionAlertWidget = ({
  currentSessionTime,
  isVisible,
  distractionCount,
  totalDistractionTime,
  resetSession,
}) => {
  DistractionAlertWidget.propTypes = {
    currentSessionTime: PropTypes.number.isRequired,
    isVisible: PropTypes.bool.isRequired,
    distractionCount: PropTypes.number.isRequired,
    totalDistractionTime: PropTypes.number.isRequired,
    resetSession: PropTypes.func.isRequired,
  };

  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
  const [distractionTime, setDistractionTime] = useState(0);

  // When isVisible changes from false to true, show welcome back message
  useEffect(() => {
    // Only show welcome back message when returning from being away
    if (isVisible && distractionCount > 0) {
      // Calculate time of last distraction
      if (totalDistractionTime > 0 && distractionCount > 0) {
        // Estimate the last distraction time (simplified)
        const estimatedLastDistractionTime = Math.round(
          totalDistractionTime / distractionCount
        );
        setDistractionTime(estimatedLastDistractionTime);
      }

      setShowWelcomeBack(true);

      // Hide the welcome back message after 5 seconds
      const timer = setTimeout(() => {
        setShowWelcomeBack(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, distractionCount, totalDistractionTime]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate focus percentage
  const calculateFocusPercentage = () => {
    if (currentSessionTime === 0) return 100;
    const focusedTime = currentSessionTime - totalDistractionTime;
    return Math.max(
      0,
      Math.min(100, Math.round((focusedTime / currentSessionTime) * 100))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full max-w-md mx-auto"
    >
      {/* Welcome back notification */}
      {showWelcomeBack && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-3 flex items-center gap-2"
        >
          <Bell className="text-white" size={20} />
          <div>
            <p>Welcome back!</p>
            <p className="text-sm opacity-80">
              You were away for {formatTime(distractionTime)}. Stay focused!
            </p>
          </div>
        </motion.div>
      )}

      {/* Focus Monitor Widget */}
      <div className="bg-white/70 backdrop-blur-lg shadow-md rounded-xl overflow-hidden border border-gray-200 w-full">
        {/* Header */}
        <div className="bg-[#31537f] text-white p-3 flex justify-between items-center"></div>

        {/* Status */}
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${isVisible ? "bg-green-500" : "bg-red-500"
                }`}
            ></div>
            <span className="text-sm">
              {isVisible ? "Focused" : "Distracted"}
            </span>
          </div>
          <div
            className={`text-xs font-medium px-3 py-1 rounded-full ${isVisible
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {isVisible ? "Active" : "Away"}
          </div>
        </div>

        {/* Metrics */}
        {!isWidgetMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4"
          >
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-semibold">Focus Rate</p>
              <div className="relative w-full bg-gray-300 rounded-full h-3 mt-1">
                <motion.div
                  className="absolute top-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-700 h-3 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${calculateFocusPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-right text-sm font-semibold mt-1">
                {calculateFocusPercentage()}%
              </p>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-1 gap-4 text-center">
              {[
                {
                  label: "Session",
                  icon: <Clock size={16} className="text-gray-600" />,
                  value: formatTime(currentSessionTime),
                },
                {
                  label: "Distractions",
                  icon: <AlertCircle size={16} className="text-yellow-500" />,
                  value: distractionCount,
                },
                {
                  label: "Time away",
                  value: formatTime(totalDistractionTime),
                },
                {
                  label: "Last break",
                  value: distractionTime ? formatTime(distractionTime) : "00:00",
                },
              ].map(({ label, icon, value }, index) => (
                <div key={index}>
                  <p className="text-sm text-gray-600 font-medium">{label}</p>
                  <div className="flex justify-center items-center mt-1 gap-2">
                    {icon}
                    <span className="text-base font-semibold">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-center mt-5">
              <button
                onClick={resetSession}
                className="flex items-center text-sm text-gray-700 hover:text-red-600 transition font-medium"
              >
                <XCircle size={16} className="mr-2" />
                Reset Session
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

function SubwaySurfers() {
  /* Timer states */
  const [sec, setSec] = useState(null);
  const [min, setMin] = useState(null);
  const [hour, setHour] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  /* Game footage states */
  const [initialTime, setInitialTime] = useState(0);
  const [focusedTime, setFocusedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [currentVideo, setCurrentVideo] = useState("home");
  const [timeReached, setTimeReached] = useState(false);
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);
  const scoreTimerRef = useRef(null);
  const scoreRef = useRef(0);

  /* Updates high score */
  useEffect(() => {
    const savedHighScore = localStorage.getItem("highScore") || 0;
    setHighScore(Number(savedHighScore));
  }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab becomes hidden
        if (video1Ref.current && !video1Ref.current.paused) video1Ref.current.pause();
        if (video2Ref.current && !video2Ref.current.paused) video2Ref.current.pause();
      } else if (isRunning && !isPaused) {
        // Tab becomes visible and game is running
        if (currentVideo === "game-start") video1Ref.current.play();
        if (currentVideo === "game-loop") video2Ref.current.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, isPaused, currentVideo]);
  /* Timer countdown */
  useEffect(() => {
    if (isRunning && timeLeft > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && isRunning) {
      endGame();
    }
  }, [isRunning, timeLeft, isPaused]);

  /* Score system */
  useEffect(() => {
    if (isRunning) {
      scoreTimerRef.current = setInterval(() => {
        scoreRef.current += 1;
        setScore((prev) => prev + 1);
      }, 90);
    }
    return () => clearInterval(scoreTimerRef.current);
  }, [isRunning]);

  /* Buffer videos early so the transitions are smooth */
  useEffect(() => {
    const video2 = video2Ref.current;
    const checkBuffer = () => {
      if (video2.buffered.length > 0 && video2.buffered.end(0) > 5) {
        video1Ref.current.addEventListener("ended", checkVideo1End);
      } else {
        requestAnimationFrame(checkBuffer);
      }
    };

    video2.preload = "auto";
    checkBuffer();
  }, []);

  /* Gets hour input from user */
  const changeHour = (e) => {
    const value = e.target.value;
    if (value === '') {
      setHour('');
    } else {
      const num = Math.max(0, Math.min(99, parseInt(value) || 0));
      setHour(num);
    }
  };

  /* Gets minute input from user */
  const changeMin = (e) => {
    const value = e.target.value;
    if (value === '') {
      setMin('');
    } else {
      const num = Math.max(0, Math.min(59, parseInt(value) || 0));
      setMin(num);
    }
  };

  /* Gets second input from user */
  const changeSec = (e) => {
    const value = e.target.value;
    if (value === '') {
      setSec('');
    } else {
      const num = Math.max(0, Math.min(59, parseInt(value) || 0));
      setSec(num);
    }
  };

  /* Changes videos */
  const checkVideo1End = () => {
    video2Ref.current.currentTime = 0;
    video2Ref.current.play().catch(console.error);
    setCurrentVideo("game-loop");
  };

  /* Initialise game */
  const startGame = async () => {
    const h = parseInt(hour) || 0;
    const m = parseInt(min) || 0;
    const s = parseInt(sec) || 0;
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds > 0) {
      setInitialTime(totalSeconds);
      setIsRunning(true);
      setTimeLeft(totalSeconds);
      setCurrentVideo("game-start");

      try {
        await video1Ref.current.play();
        video1Ref.current.addEventListener("ended", checkVideo1End);
      } catch (error) {
        console.error("Video playback error:", error);
      }
    }
  };

  /* Pauses game */
  const togglePause = () => {
    if (!timeReached) {
      const currPauseState = !isPaused;
      setIsPaused(currPauseState);

      if (currPauseState) {
        clearInterval(scoreTimerRef.current);
        video1Ref.current.pause();
        video2Ref.current.pause();
      } else {
        scoreTimerRef.current = setInterval(() => {
          scoreRef.current += 1;
          setScore((prev) => prev + 1);
        }, 90);

        currentVideo === "game-start"
          ? video1Ref.current.play()
          : video2Ref.current.play();
      }
    }
  };

  /* Ends game */
  const endGame = () => {
    const elapsed = initialTime - timeLeft;
    setFocusedTime(elapsed);
    setIsRunning(false);
    setShowGameOver(true);
    video1Ref.current.pause();
    video2Ref.current.pause();

    if (score > highScore) {
      localStorage.setItem("highScore", score.toString());
      setHighScore(score);
    }
  };

  /* Returns to home page and resets */
  const returnHome = () => {
    setScore(0);
    setShowGameOver(false);
    setCurrentVideo("home");
    setIsRunning(false);
    setTimeReached(false);
    setIsPaused(false);
    scoreRef.current = 0;
    video1Ref.current.currentTime = 0;
    video2Ref.current.currentTime = 0;
  };

  /* Time formatting */
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const formatScore = (score) => String(score).padStart(6, "0").slice(-6);

  return (
    <div
      className="relative h-[560px] w-[315px] bg-black overflow-hidden rounded-md"
      style={{ fontFamily: "Lilita One" }}
    >
      {/* HOME: looping background footage */}
      {currentVideo === "home" && (
        <video
          autoPlay
          loop
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="homepage.mp4"
        />
      )}

      {/* GAME: game footage */}
      <video
        ref={video1Ref}
        muted
        playsInline
        className={`absolute top-0 left-0 w-full h-full object-cover ${currentVideo !== "game-start" ? "hidden" : ""
          }`}
      >
        <source src="/Start.mp4" type="video/mp4" />
      </video>

      <video
        ref={video2Ref}
        muted
        loop
        playsInline
        className={`absolute top-0 left-0 w-full h-full object-cover ${currentVideo !== "game-loop" ? "hidden" : ""
          }`}
      >
        <source src="/Loop.mp4" type="video/mp4" />
      </video>

      {/* Pause Button */}
      {isRunning && !isPaused && (
        <img
          src="/Pause.png"
          alt="Pause"
          className="absolute top-3 left-3 z-10 cursor-pointer h-8 w-auto hover:scale-110 transition-transform"
          onClick={togglePause}
        />
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          style={{
            width: "240px",
            height: "171.6px",
            backgroundImage: `url(/PauseMenu.png)`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
            <img
              src="/Yes.png"
              alt="Resume"
              className="cursor-pointer h-12 w-auto max-w-[80px] hover:scale-105 transition-transform object-contain"
              onClick={togglePause}
            />
            <img
              src="/No.png"
              alt="Quit"
              className="cursor-pointer h-12 w-auto max-w-[80px] hover:scale-105 transition-transform object-contain"
              onClick={() => {
                setIsPaused(false);
                endGame();
              }}
            />
          </div>
        </div>
      )}

      {/* GAME: HUD */}
      {isRunning && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          <div className="bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            {formatTime(timeLeft)}
          </div>
          <div className="bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            SCORE: {formatScore(score)}
          </div>
          <div
            className="bg-black/50 text-white px-2 py-1 rounded-md text-sm"
            style={{ fontFamily: "Lilita One" }}
          >
            TOP RUN: {formatScore(highScore)}
          </div>
        </div>
      )}

      {/* HOME: Timer input panel */}
      {!isRunning && !showGameOver && (
        <div>
          <p className="absolute bottom-40 text-white translate-x-4 flex animate-pulse -rotate-8" style={{ transform: 'scale(1.1)'}}>
            Input how long your task is!
          </p>
          <div
            className="absolute bottom-25 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-br from-yellow-500 to-red-500 px-2 py-2 rounded-md grid grid-cols-3 gap-2"
            style={{ fontFamily: "Lilita One" }}
          >
            <input
              className="text-center bg-white rounded text-amber-500		 p-1"
              type="text"
              min="0"
              max="99"
              value={hour}
              onChange={changeHour}
              placeholder="HH"
            />
            <input
              className="text-center text-amber-500	 bg-white rounded p-1"
              type="text"
              min="0"
              max="59"
              value={min}
              onChange={changeMin}
              placeholder="MM"
            />
            <input
              className="text-center text-amber-500	 bg-white rounded p-1"
              type="text"
              min="0"
              max="59"
              value={sec}
              onChange={changeSec}
              placeholder="SS"
            />
          </div>
        </div>
      )}

      {/* HOME: Start button */}
      {!isRunning && !showGameOver && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={startGame}
            disabled={isRunning}
            className="w-34 h-12 bg-[url('/Start-btn.png')] bg-cover bg-center hover:scale-105"
          />
        </div>
      )}

      {/* END: Game over screen */}
      {showGameOver && (
        <div
          className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center absolute inset-0 z-50"
          style={{
            backgroundImage: `url(/End_Screen.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mt-24 text-center">
            <p
              className="absolute top-14 right-13.5 text-xl font-bold "
              style={{ fontFamily: "Lilita One" }}
            >
              {formatScore(score)}
            </p>
            <p
              className="absolute top-34 right-11 text-xl font-bold "
              style={{ fontFamily: "Lilita One" }}
            >
              {formatTime(focusedTime)}
            </p>
          </div>
          <div className="absolute bottom-7 w-full flex justify-center gap-8">
            <img
              src="/Home.png"
              alt="Home"
              className="cursor-pointer h-11 w-auto hover:scale-105 transition-transform"
              onClick={returnHome}
            />
          </div>
        </div>
      )}
    </div>
  );
}
