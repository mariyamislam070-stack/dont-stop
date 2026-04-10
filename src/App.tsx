/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import Header from "./components/Header";
import Navigation, { TabType } from "./components/Navigation";
import ClassesView from "./components/ClassesView";
import GlassCard from "./components/GlassCard";
import LoginView, { UserRole } from "./components/LoginView";
import NoticeView from "./components/NoticeView";
import AIAssistant from "./components/AIAssistant";
import ErrorBoundary from "./components/ErrorBoundary";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot, collection, deleteDoc, query, orderBy } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Image as ImageIcon, Info, GraduationCap, Users, Calendar, LogOut, Plus, Edit2, Phone, Mail, X, Trash2, Upload, Check, School } from "lucide-react";

export interface UserData {
  uid: string;
  name: string;
  role: UserRole;
  className?: string;
  section?: string;
  email: string;
  photoURL: string;
  rollId?: string;
  designation?: string;
  phone?: string;
}

export interface TeacherProfile {
  uid: string;
  name: string;
  designation: string;
  email: string;
  img: string;
  phone: string;
}

export interface StudentProfile {
  uid: string;
  name: string;
  rollId: string;
  className: string;
  section: string;
  email: string;
}

export interface HomeworkItem {
  id: string;
  task: string;
  date: string;
}

export interface HomeworkData {
  [classId: string]: HomeworkItem[];
}

export interface SuggestionItem {
  id: string;
  text: string;
  date: string;
}

export interface BookSuggestionData {
  [bookKey: string]: SuggestionItem[];
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: "Important" | "General";
  date: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("Home");
  const [user, setUser] = useState<UserData | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  
  const [examTargetDate, setExamTargetDate] = useState("2027-02-01T00:00:00");
  const [schoolStatus, setSchoolStatus] = useState("Class Ongoing");
  const [upcomingEvent, setUpcomingEvent] = useState({ title: "Annual Sports Meet 2026", description: "Join us for a day of athletic excellence and school spirit on April 15th." });
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [homework, setHomework] = useState<HomeworkData>({});
  
  const [bookSuggestions, setBookSuggestions] = useState<BookSuggestionData>({});

  // New Academic States
  const [results, setResults] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});
  const [routines, setRoutines] = useState<any>({});
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);

  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ designation: "", phone: "" });

  const [signInTrigger, setSignInTrigger] = useState<{name: string, role: string} | null>(null);

  // Firestore Sync
  useEffect(() => {
    const path = "users";
    const unsubTeachers = onSnapshot(collection(db, path), (snapshot) => {
      const teachers: TeacherProfile[] = [];
      const students: StudentProfile[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.role === "Teacher") {
          teachers.push({
            uid: data.uid,
            name: data.name,
            designation: data.designation,
            email: data.email,
            img: data.photoURL,
            phone: data.phoneNumber
          });
        } else {
          students.push({
            uid: data.uid,
            name: data.name,
            rollId: data.rollId,
            className: data.className,
            section: data.section || "A",
            email: data.email
          });
        }
      });
      setTeacherProfiles(teachers);
      setStudentProfiles(students);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubTeachers();
  }, []);

  // Sync Gallery and Settings
  useEffect(() => {
    const galleryPath = "gallery";
    const unsubGallery = onSnapshot(query(collection(db, galleryPath), orderBy("timestamp", "desc")), (snapshot) => {
      const images = snapshot.docs.map(doc => doc.data() as GalleryImage);
      setGalleryImages(images);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, galleryPath);
    });

    const settingsPath = "settings/global";
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.examTargetDate) setExamTargetDate(data.examTargetDate);
        if (data.schoolStatus && data.schoolStatus !== schoolStatus) {
          setSchoolStatus(data.schoolStatus);
          announceStatus(data.schoolStatus);
        }
        if (data.upcomingEventTitle || data.upcomingEventDescription) {
          setUpcomingEvent({
            title: data.upcomingEventTitle || upcomingEvent.title,
            description: data.upcomingEventDescription || upcomingEvent.description
          });
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, settingsPath);
    });

    return () => {
      unsubGallery();
      unsubSettings();
    };
  }, []);

  // Sync Notices, Homework, and Attendance
  useEffect(() => {
    const noticesPath = "notices";
    const unsubNotices = onSnapshot(query(collection(db, noticesPath), orderBy("timestamp", "desc")), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as NoticeItem);
      setNotices(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, noticesPath);
    });

    const homeworkPath = "homework";
    const unsubHomework = onSnapshot(query(collection(db, homeworkPath), orderBy("timestamp", "desc")), (snapshot) => {
      const hwData: HomeworkData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!hwData[data.classId]) hwData[data.classId] = [];
        hwData[data.classId].push({
          id: data.id,
          task: data.task,
          date: data.date
        });
      });
      setHomework(hwData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, homeworkPath);
    });

    const attendancePath = "attendance";
    const unsubAttendance = onSnapshot(collection(db, attendancePath), (snapshot) => {
      const attData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        attData[data.classId] = data.percentage;
      });
      setAttendance(attData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, attendancePath);
    });

    const suggestionsPath = "suggestions";
    const unsubSuggestions = onSnapshot(query(collection(db, suggestionsPath), orderBy("timestamp", "desc")), (snapshot) => {
      const suggData: BookSuggestionData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!suggData[data.bookKey]) suggData[data.bookKey] = [];
        suggData[data.bookKey].push({
          id: data.id,
          text: data.text,
          date: data.date
        });
      });
      setBookSuggestions(suggData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, suggestionsPath);
    });

    const routinesPath = "routines";
    const unsubRoutines = onSnapshot(collection(db, routinesPath), (snapshot) => {
      const routData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        routData[data.classId] = data.data;
      });
      setRoutines(routData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, routinesPath);
    });

    const resultsPath = "results";
    const unsubResults = onSnapshot(collection(db, resultsPath), (snapshot) => {
      const resData: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!resData[data.classId]) resData[data.classId] = {};
        resData[data.classId][data.userId] = data.subjects;
      });
      setResults(resData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, resultsPath);
    });

    return () => {
      unsubNotices();
      unsubHomework();
      unsubAttendance();
      unsubSuggestions();
      unsubRoutines();
      unsubResults();
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      setShowGreeting(true);
      const timer = setTimeout(() => setShowGreeting(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const targetDate = new Date(examTargetDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examTargetDate]);

  const [tourTrigger, setTourTrigger] = useState(0);

  const announceStatus = (status: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Attention! It is now ${status}. Please follow the school rules.`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUpdateSchoolStatus = async (status: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), { schoolStatus: status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleLogin = async (userData: UserData) => {
    setUser(userData);
    
    // Save to Firestore
    const path = `users/${userData.uid}`;
    try {
      await setDoc(doc(db, "users", userData.uid), {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL,
        role: userData.role,
        className: userData.className || "N/A",
        section: userData.section || "N/A",
        rollId: userData.rollId || "N/A",
        designation: userData.designation || "Faculty",
        phoneNumber: userData.phone || "N/A"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }

    setSignInTrigger({ name: userData.name, role: userData.role });

    const hasSeenTour = localStorage.getItem(`tnhs_tour_${userData.name}_${userData.role}`);
    if (!hasSeenTour) {
      setTourTrigger(prev => prev + 1);
      localStorage.setItem(`tnhs_tour_${userData.name}_${userData.role}`, "true");
    }
  };

  const handleRoleSwitch = (role: "Teacher" | "Student") => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("Mode updated, Master Sayid.");
      utterance.rate = 0.85;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("Home");
  };

  const handleUpdateExamDate = async (newDate: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), { examTargetDate: newDate }, { merge: true });
      setIsEditingExam(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleUpdateEvent = async (title: string, description: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), { 
        upcomingEventTitle: title,
        upcomingEventDescription: description
      }, { merge: true });
      setIsEditingEvent(false);
      announceSuccess("The school board has been updated");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const announceSuccess = (message: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Update complete! ${message}, ${user?.name}.`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user || user.role !== "Teacher" || !e.target.files?.[0]) return;
    setIsUploading(true);
    const file = e.target.files[0];
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const id = Math.random().toString(36).substr(2, 9);
        const newImage: GalleryImage = {
          id,
          url: base64String,
          caption: "New Gallery Photo",
          uploadedBy: user.name,
          timestamp: new Date().toISOString()
        };
        const path = `gallery/${id}`;
        try {
          await setDoc(doc(db, "gallery", id), newImage);
          setIsUploading(false);
          announceSuccess("The gallery has been updated");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsUploading(false);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `gallery/${id}`;
    try {
      await deleteDoc(doc(db, "gallery", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const deleteHomework = useCallback(async (classId: string, id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `homework/${id}`;
    try {
      await deleteDoc(doc(db, "homework", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const deleteNotice = useCallback(async (id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `notices/${id}`;
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const deleteBookSuggestion = useCallback(async (bookKey: string, id: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `suggestions/${id}`;
    try {
      await deleteDoc(doc(db, "suggestions", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const [postTrigger, setPostTrigger] = useState<{ classId: string; type: string; isUpdate?: boolean } | null>(null);

  const addHomework = useCallback(async (classId: string, task: string) => {
    if (!user || user.role !== "Teacher") return;
    const date = new Date().toLocaleDateString();
    const id = Math.random().toString(36).substr(2, 9);
    const path = `homework/${id}`;
    try {
      await setDoc(doc(db, "homework", id), {
        id,
        classId,
        task,
        date,
        timestamp: new Date().toISOString()
      });
      setPostTrigger({ classId, type: "Homework" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateHomework = useCallback(async (classId: string, id: string, newTask: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `homework/${id}`;
    try {
      await setDoc(doc(db, "homework", id), { task: newTask }, { merge: true });
      setPostTrigger({ classId, type: "Homework", isUpdate: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const addBookSuggestion = useCallback(async (bookKey: string, suggestion: string) => {
    if (!user || user.role !== "Teacher") return;
    const date = new Date().toLocaleDateString();
    const id = Math.random().toString(36).substr(2, 9);
    const path = `suggestions/${id}`;
    try {
      await setDoc(doc(db, "suggestions", id), {
        id,
        bookKey,
        text: suggestion,
        date,
        timestamp: new Date().toISOString()
      });
      setPostTrigger({ classId: bookKey.split("-")[0], type: "Suggestion" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateBookSuggestion = useCallback(async (bookKey: string, id: string, newText: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `suggestions/${id}`;
    try {
      await setDoc(doc(db, "suggestions", id), { text: newText }, { merge: true });
      setPostTrigger({ classId: bookKey.split("-")[0], type: "Suggestion", isUpdate: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateAttendance = useCallback(async (classId: string, percentage: number) => {
    if (!user || user.role !== "Teacher") return;
    const path = `attendance/${classId}`;
    try {
      await setDoc(doc(db, "attendance", classId), {
        classId,
        percentage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateRoutine = useCallback(async (classId: string, day: string, period: string, subject: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `routines/${classId}`;
    
    const currentRoutine = routines[classId] || {};
    const updatedData = {
      ...currentRoutine,
      [day]: {
        ...(currentRoutine[day] || {}),
        [period]: subject
      }
    };

    try {
      await setDoc(doc(db, "routines", classId), {
        classId,
        data: updatedData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user, routines]);

  const addNotice = useCallback(async (title: string, content: string, type: "Important" | "General") => {
    if (!user || user.role !== "Teacher") return;
    const id = Math.random().toString(36).substr(2, 9);
    const date = "Just now";
    const path = `notices/${id}`;
    try {
      await setDoc(doc(db, "notices", id), {
        id,
        title,
        content,
        type,
        date,
        timestamp: new Date().toISOString()
      });
      setPostTrigger({ classId: "Global", type: "Notice" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const updateNotice = useCallback(async (id: string, newTitle: string, newContent: string) => {
    if (!user || user.role !== "Teacher") return;
    const path = `notices/${id}`;
    try {
      await setDoc(doc(db, "notices", id), {
        title: newTitle,
        content: newContent
      }, { merge: true });
      setPostTrigger({ classId: "Global", type: "Notice", isUpdate: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <LoginView 
      onLogin={handleLogin} 
      isDarkMode={isDarkMode} 
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
    />;
  }

  const handleUpdateSelfProfile = async () => {
    if (!user || user.role !== "Teacher") return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, "users", user.uid), {
        designation: editData.designation,
        phoneNumber: editData.phone
      }, { merge: true });
      
      setUser(prev => prev ? { ...prev, designation: editData.designation, phone: editData.phone } : null);
      setIsEditingProfile(false);
      setSelectedTeacher(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const renderContent = () => {
    const statusColors: any = {
      "Class Ongoing": "bg-emerald-500",
      "Tiffin Time": "bg-yellow-400",
      "School Closed": "bg-orange-500",
      "Occasion Running": "bg-purple-500"
    };

    const statusGlows: any = {
      "Class Ongoing": "shadow-[0_0_40px_rgba(16,185,129,0.8)]",
      "Tiffin Time": "shadow-[0_0_40px_rgba(250,204,21,0.8)]",
      "School Closed": "shadow-[0_0_40px_rgba(249,115,22,0.8)]",
      "Occasion Running": "shadow-[0_0_40px_rgba(168,85,247,0.8)]"
    };

    switch (activeTab) {
      case "Home":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 space-y-6 pb-32"
          >
            {/* Notice Ticker */}
            <div className="glass rounded-2xl overflow-hidden py-3 px-4 flex items-center gap-4">
              <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase shrink-0">News</div>
              <div className="relative flex-1 overflow-hidden h-5">
                <motion.div 
                  animate={{ x: ["100%", "-100%"] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="whitespace-nowrap text-sm font-medium text-emerald-900 absolute"
                >
                  {notices.map(n => n.title).join(" • ")}
                </motion.div>
              </div>
            </div>

            {/* School Status Banner */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-[32px] glass border-white/40 flex flex-col gap-6 relative overflow-hidden shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center gap-6">
                {/* Enhanced Status Signal */}
                <div className="relative shrink-0">
                  {/* Outer Halo (Double Pulse) */}
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className={`absolute inset-[-12px] rounded-full ${statusColors[schoolStatus]} blur-xl`}
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }}
                    className={`absolute inset-[-20px] rounded-full ${statusColors[schoolStatus]} blur-2xl`}
                  />
                  
                  {/* Main Glowing Circle */}
                  <div className={`w-16 h-16 rounded-full ${statusColors[schoolStatus]} ${statusGlows[schoolStatus]} relative z-10 flex items-center justify-center border-4 border-white/20`}>
                    <div className="w-4 h-4 rounded-full bg-white/40 animate-pulse" />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-black text-emerald-900 tracking-tight">
                      {schoolStatus}
                    </h4>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-emerald-800/70 font-bold leading-tight">
                    {schoolStatus === "Tiffin Time" ? "Break is active. Students are in the playground." : 
                     schoolStatus === "School Closed" ? "The campus is currently closed for the day." :
                     schoolStatus === "Occasion Running" ? "A special event is currently being celebrated." :
                     "Academic sessions are proceeding as scheduled."}
                  </p>
                </div>
              </div>

              {user.role === "Teacher" && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-500/10">
                  {Object.keys(statusColors).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateSchoolStatus(status)}
                      className={`py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                        schoolStatus === status 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]" 
                          : "bg-white/30 text-emerald-800 hover:bg-white/50 border border-white/20"
                      }`}
                    >
                      {status.replace(" Time", "").replace(" Running", "")}
                    </button>
                  ))}
                </div>
              )}
              
              <div className={`absolute right-0 top-0 bottom-0 w-2 ${statusColors[schoolStatus]}`} />
            </motion.div>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-emerald-900 tracking-tight">Welcome back, {user.name}</h2>
                <p className="text-emerald-800/60 text-lg">
                  {user.role === "Teacher" ? "Administrator Access" : `Class ${user.className} Student`}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl glass text-emerald-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>

            {/* Exam Countdown */}
            <GlassCard className="relative overflow-hidden border-emerald-500/30">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Calendar className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">SSC Exam Countdown</span>
                  </div>
                  <AnimatePresence>
                    {user.role === "Teacher" && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsEditingExam(!isEditingExam)}
                        className="p-2 rounded-lg hover:bg-white/40 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-emerald-700" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {isEditingExam ? (
                  <div className="flex gap-2">
                    <input 
                      type="datetime-local"
                      defaultValue={examTargetDate.slice(0, 16)}
                      onChange={(e) => setExamTargetDate(e.target.value)}
                      className="flex-1 bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none"
                    />
                    <button 
                      onClick={() => handleUpdateExamDate(examTargetDate)}
                      className="p-2 bg-emerald-600 text-white rounded-xl"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Days", value: timeLeft.days },
                      { label: "Hours", value: timeLeft.hours },
                      { label: "Mins", value: timeLeft.mins },
                      { label: "Secs", value: timeLeft.secs }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center glass p-2 rounded-xl">
                        <span className="text-2xl font-black text-emerald-900">{item.value}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700/60">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-emerald-700" />
                </div>
                <span className="font-bold text-emerald-900">Students</span>
                <span className="text-2xl font-black text-emerald-700">1,200+</span>
              </GlassCard>
              <GlassCard className="flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-700" />
                </div>
                <span className="font-bold text-emerald-900">Teachers</span>
                <span className="text-2xl font-black text-emerald-700">45+</span>
              </GlassCard>
            </div>

            <GlassCard className="relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Calendar className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-xs">Upcoming Event</span>
                  </div>
                  <AnimatePresence>
                    {user.role === "Teacher" && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsEditingEvent(!isEditingEvent)}
                        className="p-2 rounded-lg hover:bg-white/40 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-emerald-700" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                
                {isEditingEvent ? (
                  <div className="space-y-3">
                    <input 
                      type="text"
                      value={upcomingEvent.title}
                      onChange={(e) => setUpcomingEvent({ ...upcomingEvent, title: e.target.value })}
                      placeholder="Event Title"
                      className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none font-bold"
                    />
                    <textarea 
                      value={upcomingEvent.description}
                      onChange={(e) => setUpcomingEvent({ ...upcomingEvent, description: e.target.value })}
                      placeholder="Event Description"
                      className="w-full bg-white/30 border border-emerald-500/30 rounded-xl px-4 py-2 text-emerald-900 focus:outline-none text-sm h-24"
                    />
                    <button 
                      onClick={() => handleUpdateEvent(upcomingEvent.title, upcomingEvent.description)}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Save Event
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-emerald-900">{upcomingEvent.title}</h3>
                    <p className="text-emerald-800/70">{upcomingEvent.description}</p>
                    <button className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors">
                      View Schedule
                    </button>
                  </>
                )}
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl" />
            </GlassCard>
          </motion.div>
        );
      case "Classes":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ClassesView 
              userRole={user.role} 
              userClass={user.className} 
              homework={homework}
              onAddHomework={addHomework}
              onUpdateHomework={updateHomework}
              onDeleteHomework={deleteHomework}
              bookSuggestions={bookSuggestions}
              onAddSuggestion={addBookSuggestion}
              onUpdateSuggestion={updateBookSuggestion}
              onDeleteSuggestion={deleteBookSuggestion}
              attendance={attendance}
              onUpdateAttendance={updateAttendance}
              routines={routines}
              onUpdateRoutine={updateRoutine}
            />
          </motion.div>
        );
      case "Notice":
        return (
          <NoticeView 
            user={user} 
            notices={notices} 
            onAddNotice={addNotice} 
            onUpdateNotice={updateNotice} 
            onDeleteNotice={deleteNotice}
          />
        );
      case "Gallery":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-6 space-y-6 pb-32"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">Gallery</h2>
              <AnimatePresence>
                {user.role === "Teacher" && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="relative"
                  >
                    <input 
                      type="file" 
                      id="gallery-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleUploadImage}
                    />
                    <label 
                      htmlFor="gallery-upload"
                      className={`p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span className="font-bold text-sm">Upload</span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {galleryImages.length > 0 ? galleryImages.map((img) => (
                <motion.div
                  key={img.id}
                  whileHover={{ scale: 1.02 }}
                  className="aspect-square rounded-3xl overflow-hidden glass border-white/40 shadow-lg group cursor-pointer relative"
                >
                  <img 
                    src={img.url} 
                    alt={img.caption} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="flex-1">
                      <span className="text-white text-[10px] font-bold block">{img.caption}</span>
                      <span className="text-white/60 text-[8px]">By {img.uploadedBy}</span>
                    </div>
                    <AnimatePresence>
                      {user.role === "Teacher" && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteGalleryImage(img.id); }}
                          className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )) : (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-3xl glass animate-pulse" />
                ))
              )}
            </div>
          </motion.div>
        );
      case "About":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 space-y-8 pb-32"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">About Us</h2>
              <AnimatePresence>
                {user.role === "Teacher" && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <GlassCard className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Info className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Our History</h3>
              <p className="text-emerald-800/80 leading-relaxed">
                Founded in 1995, TNHS ELITE ASK has been a beacon of knowledge for over three decades. What started as a small community school has grown into a premier educational institution, consistently producing top-tier results and fostering a culture of innovation and leadership.
              </p>
            </GlassCard>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-emerald-900">Teachers Gallery</h3>
                <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">{teacherProfiles.length} Members</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {teacherProfiles.map((teacher, i) => (
                  <GlassCard 
                    key={i} 
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setEditData({ designation: teacher.designation, phone: teacher.phone });
                    }}
                    className="flex flex-col items-center text-center gap-3 p-4 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="w-20 h-20 rounded-full glass p-1">
                      <img 
                        src={teacher.img} 
                        alt={teacher.name} 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">{teacher.name}</h4>
                      <p className="text-[10px] text-emerald-700/60 uppercase tracking-wider font-bold">{teacher.designation}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Teacher Profile Popup */}
            <AnimatePresence>
              {selectedTeacher && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setSelectedTeacher(null); setIsEditingProfile(false); }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm"
                  >
                    <GlassCard className="p-8 space-y-6 border-emerald-500/30 shadow-2xl">
                      <button 
                        onClick={() => { setSelectedTeacher(null); setIsEditingProfile(false); }}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5 text-emerald-900" />
                      </button>

                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-24 h-24 rounded-full glass p-1.5 ring-4 ring-emerald-500/20">
                          <img 
                            src={selectedTeacher.img} 
                            alt={selectedTeacher.name} 
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-emerald-900">{selectedTeacher.name}</h3>
                          {isEditingProfile ? (
                            <input 
                              type="text"
                              value={editData.designation}
                              onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                              className="w-full bg-white/30 border border-emerald-500/30 rounded-lg px-3 py-1 text-center text-emerald-900 focus:outline-none"
                            />
                          ) : (
                            <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs">{selectedTeacher.designation}</p>
                          )}
                        </div>

                        <div className="w-full space-y-3 pt-4">
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/20">
                            <Mail className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm text-emerald-900 font-medium truncate">{selectedTeacher.email}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/20">
                            <Phone className="w-5 h-5 text-emerald-600" />
                            {isEditingProfile ? (
                              <input 
                                type="tel"
                                value={editData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-emerald-900 font-medium"
                              />
                            ) : (
                              <span className="text-sm text-emerald-900 font-medium">{selectedTeacher.phone}</span>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {user.role === "Teacher" && user.uid === selectedTeacher.uid && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="w-full pt-4"
                            >
                              {isEditingProfile ? (
                                <div className="flex gap-3">
                                  <button 
                                    onClick={handleUpdateSelfProfile}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                                  >
                                    Save Changes
                                  </button>
                                  <button 
                                    onClick={() => setIsEditingProfile(false)}
                                    className="px-6 py-3 glass text-emerald-700 rounded-xl font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setIsEditingProfile(true)}
                                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit My Profile
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-emerald-900">Student Gallery</h3>
                <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">{studentProfiles.length} Members</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {studentProfiles.map((student, i) => (
                  <GlassCard key={i} className="flex flex-col items-center text-center gap-3 p-4 relative group">
                    <AnimatePresence>
                      {user.role === "Teacher" && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          onClick={() => handleDeleteProfile(student.uid)}
                          className="absolute top-2 right-2 p-2 bg-red-500/10 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-700 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">{student.name}</h4>
                      <p className="text-[10px] text-emerald-700/60 uppercase tracking-wider font-bold">Class {student.className} • Section {student.section}</p>
                      <p className="text-[10px] text-emerald-700/40 mt-1">Roll: {student.rollId}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <AnimatePresence>
        {isSplashVisible && (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-32 h-32 rounded-[32px] bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-200 mb-8"
            >
              <School className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-center space-y-2"
            >
              <h1 className="text-4xl font-black text-emerald-900 tracking-tighter glow-text">
                TNHS ELITE ASK
              </h1>
              <p className="text-emerald-700/40 font-bold uppercase tracking-[0.3em] text-[10px]">
                Premium Academic Portal
              </p>
            </motion.div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              .glow-text {
                text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
                animation: glow 2s ease-in-out infinite alternate;
              }
              @keyframes glow {
                from { text-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
                to { text-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
              }
            `}} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTab === "Home" && !isSplashVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Header 
              user={user} 
              onProfileClick={() => setShowProfilePopup(true)}
              onNoticeClick={() => setActiveTab("Notice")}
              hasNewNotices={notices.length > 0}
              onRoleSwitch={handleRoleSwitch}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Details Popup */}
      <AnimatePresence>
        {showProfilePopup && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfilePopup(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              <GlassCard className="p-8 space-y-6 border-white/40 shadow-2xl overflow-hidden">
                <button 
                  onClick={() => setShowProfilePopup(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-emerald-900" />
                </button>

                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-24 h-24 rounded-full glass p-1.5 ring-4 ring-emerald-500/20 overflow-hidden">
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-emerald-900">{user.name}</h3>
                    <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs">{user.role}</p>
                  </div>

                  <div className="w-full space-y-3 pt-4">
                    {user.role === "Student" ? (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/30 border border-white/20">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Class</span>
                          <span className="text-sm text-emerald-900 font-bold">{user.className}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/30 border border-white/20">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Section</span>
                          <span className="text-sm text-emerald-900 font-bold">{user.section || "A"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/30 border border-white/20">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Roll / ID</span>
                          <span className="text-sm text-emerald-900 font-bold">{user.rollId}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/30 border border-white/20">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Designation</span>
                          <span className="text-sm text-emerald-900 font-bold">{user.designation}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/30 border border-white/20">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Phone</span>
                          <span className="text-sm text-emerald-900 font-bold">{user.phone}</span>
                        </div>
                        <button className="w-full py-3 rounded-xl bg-emerald-600/20 text-emerald-700 font-bold text-xs uppercase tracking-widest hover:bg-emerald-600/30 transition-all">
                          Change Password/PIN
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -100, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[100] w-[90%] max-w-sm"
          >
            <GlassCard className="!bg-emerald-600/90 !border-emerald-400/30 text-white p-4 text-center shadow-2xl">
              <p className="text-lg font-bold">
                Assalamu Alaikum {user.name},
              </p>
              <p className="text-sm opacity-90">
                Welcome to {user.role === "Teacher" ? "Admin Portal" : `Class ${user.className}`}
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`max-w-4xl mx-auto ${activeTab === "Home" ? "pt-24" : "pt-8"}`}>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        hasNewNotices={notices.length > 0}
      />
      
      <AIAssistant 
        user={user} 
        homework={homework} 
        onAddHomework={addHomework} 
        tourTrigger={tourTrigger}
        signInTrigger={signInTrigger}
        postTrigger={postTrigger}
      />
      </div>
    </ErrorBoundary>
  );
}
