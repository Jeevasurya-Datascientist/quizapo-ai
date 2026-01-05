// src/App.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { db, auth } from './services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  deleteDoc,
  arrayRemove,
  getDoc,
  limit,
  writeBatch
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// Header is in a separate file, so I need to check that too if I want global nav links. 
// But first, let's make sure Dashboard links to these new pages.
import { Header } from './components/Header';
import { McqGeneratorForm } from './components/McqGeneratorForm';
import { McqList } from './components/McqList';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { StudentLogin } from './components/StudentLogin';
import { TestPage } from './components/TestPage';
import { TestResults } from './components/TestResults';
import { TestHistory } from './components/TestHistory';
import { ManualMcqCreator } from './components/ManualMcqCreator';
import { AuthPortal, RegistrationData } from './components/AuthPortal';
import { Notifications } from './components/Notifications';
import { TestAnalytics } from './components/TestAnalytics';
import { ProfilePage } from './components/ProfilePage';
import { EmailVerification } from './components/EmailVerification';
import { AuthActionHandler } from './components/AuthActionHandler';
import { SendNotificationModal } from './components/SendNotificationModal';
import { Certificate } from './components/Certificate';
import { LandingPage } from './components/LandingPage';

// --- Modular Components ---
import { Dashboard } from './components/Dashboard';
import { NetworkPage } from './components/NetworkPage';
import { followUser, unfollowUser } from './services/firebase';
import { ContentLibrary } from './components/ContentLibrary';
import { NetworkCenter } from './components/NetworkCenter';
import { IntegrityCenter } from './components/IntegrityCenter';
import { EditBankPage } from './components/EditBankPage';
import { MyBanksPage } from './components/MyBanksPage';
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from './components/PublicPages';
import { TeamPage } from './components/TeamPage';
import { CareerPage } from './components/CareerPage';

// --- Types & Services ---
import { Role, View } from './types';
import type {
  FormState, MCQ, Test, GeneratedMcqSet, Student, TestAttempt, FollowRequest,
  AppNotification, AppUser, CustomFormField, ViolationAlert, ConnectionRequest,
  QuestionBank
} from './types';
import { generateMcqs } from './services/geminiService';

declare global {
  interface Window { jspdf: any; docx: any; }
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item, (k, v) => {
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)) {
          return new Date(v);
        }
        return v;
      });
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
  }
  return defaultValue;
};

const App: React.FC = () => {
  // --- 1. Core State ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [view, setView] = useState<View>('landing');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Core Watermark Check
  useEffect(() => {
    import('./core/js-corp-lock').then(({ verifyJsCorp }) => {
      if (!verifyJsCorp()) {
        document.body.innerHTML = "<h1>Critical System Error: Core Integrity Check Failed</h1>";
      }
    });
  }, []);

  // Handling Deep Links & Auth Actions on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode && oobCode) {
      setAuthActionParams({ mode, oobCode });
      setView('authAction');
      setIsLoading(false);
    }
  }, []);

  // --- 2. Data State (Persisted/Cached) ---
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  // Listen to users for network page (Real-time)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => d.data() as AppUser);
      setAllUsers(users);
    });
    return () => unsubscribe();
  }, [currentUser?.id]); // Only re-sub if user ID changes (login/logout)

  // Duplicate handleUnfollow removed from here (it exists at line 494)


  const [userMetadata, setUserMetadata] = useState<AppUser[]>(() => getInitialState('userMetadata', []));
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [testHistory, setTestHistory] = useState<TestAttempt[]>(() => getInitialState('testHistory', []));

  // --- 3. Live Data (Firestore Synced) ---
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [publishedTests, setPublishedTests] = useState<Test[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ignoredByStudents, setIgnoredByStudents] = useState<AppNotification[]>([]);
  const [violationAlerts, setViolationAlerts] = useState<ViolationAlert[]>([]);
  const [followingList, setFollowingList] = useState<AppUser[]>([]);
  const [followers, setFollowers] = useState<AppUser[]>([]);
  const [connectedFaculty, setConnectedFaculty] = useState<AppUser[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);

  // -- Separate Attempt States --
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]); // For Analytics (All students)
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([]); // For History (Current user)

  // --- 4. Session State ---
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [latestTestResult, setLatestTestResult] = useState<TestAttempt | null>(null);
  const [analyticsTest, setAnalyticsTest] = useState<Test | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<TestAttempt | null>(null);
  const [activeBankId, setActiveBankId] = useState<string | null>(null);

  // --- 5. Modal State ---
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgTargetUser, setMsgTargetUser] = useState('');

  // State for Auth Actions
  const [authActionParams, setAuthActionParams] = useState<{ mode: string, oobCode: string } | null>(null);

  // --- Persistence Effects ---
  useEffect(() => { try { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); } catch (e) { } }, [userMetadata]);
  useEffect(() => { try { localStorage.setItem('userMetadata', JSON.stringify(userMetadata)); } catch (e) { } }, [userMetadata]);
  // useEffect(() => { try { localStorage.setItem('allGeneratedMcqs', JSON.stringify(allGeneratedMcqs)); } catch (e) { } }, [allGeneratedMcqs]);
  useEffect(() => { try { localStorage.setItem('testHistory', JSON.stringify(testHistory)); } catch (e) { } }, [testHistory]);
  useEffect(() => { try { localStorage.setItem('testHistory', JSON.stringify(testHistory)); } catch (e) { } }, [testHistory]);

  // --- Auth & User Sync ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (!user) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- User Sync with Realtime Listener ---
  useEffect(() => {
    if (!firebaseUser) {
      if (view !== 'auth' && view !== 'emailVerification' && view !== 'landing' && view !== 'team' && view !== 'about' && view !== 'contact' && view !== 'privacy' && view !== 'terms' && view !== 'authAction') {
        setCurrentUser(null);
        setView('landing');
      }
      return;
    }

    if (!firebaseUser.emailVerified) {
      setIsLoading(false);
      return;
    }

    // Real-time listener for current user profile
    // This ensures followers/following counts update instantly across the app
    const userRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Force ID from doc ID to ensure match with Auth UID (Critical for RLS)
        const userData = { ...data, id: docSnap.id } as AppUser;
        setCurrentUser(userData);

        // Update metadata cache if needed, or just rely on state
        setUserMetadata(prev => [...prev.filter(u => u.id !== userData.id), userData]);

        // Smart Navigation / Deep Linking on Initial Load
        if (isLoading) {
          const params = new URLSearchParams(window.location.search);
          const testId = params.get('testId');
          const mode = params.get('mode');
          // Handle Firebase Auth Actions handled by top-level useEffect now
          // if (mode && oobCode) { ... }

          // if (testId && !activeTest) { ... }

          // Redirect if on auth/landing pages but already logged in
          if (['auth', 'landing', 'idVerification', 'emailVerification'].includes(view)) {
            setView('dashboard');
          }
          setIsLoading(false);
        } else if (view === 'auth') {
          // Existing user logged in manually (or via Google) needs redirect
          setView('dashboard');
        }
      } else {
        // User doc missing? Only force logout if we aren't already in Auth/Registration flow
        // detailed check: if I am in 'auth', I might be registering via Google.
        if (view !== 'auth') {
          signOut(auth);
          setView('auth');
        }
      }
    }, (err) => {
      console.error("User snapshot error:", err);
      // Fallback or alert?
    });

    return () => unsubscribe();
  }, [firebaseUser]); // Re-run only if auth user changes

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes: (() => void)[] = [];

    // Data Loading
    unsubscribes.push(onSnapshot(query(collection(db, "tests"), where("facultyId", "==", currentUser.id)), (s) => setPublishedTests(s.docs.map(d => d.data() as Test))));
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("studentId", "==", currentUser.id)), (s) => setNotifications(s.docs.map(d => d.data() as AppNotification))));

    // Sync Attempts (Student view)
    unsubscribes.push(onSnapshot(query(collection(db, "testAttempts"), where("studentId", "==", currentUser.id)), (s) => {
      const attempts = s.docs.map(d => d.data() as TestAttempt);
      setUserAttempts(attempts);
      setTestHistory(attempts); // Keep local storage synced
    }));

    // Social & Integrity
    unsubscribes.push(onSnapshot(query(collection(db, "follow_requests"), where("toUserId", "==", currentUser.id), where("status", "==", "pending")), (s) => setFollowRequests(s.docs.map(d => d.data() as FollowRequest))));
    // connectionRequests removed (legacy)
    unsubscribes.push(onSnapshot(query(collection(db, "violationAlerts"), where("facultyId", "==", currentUser.id), where("status", "==", "pending")), (s) => setViolationAlerts(s.docs.map(d => d.data() as ViolationAlert))));
    unsubscribes.push(onSnapshot(query(collection(db, "notifications"), where("facultyId", "==", currentUser.id), where("status", "==", "ignored")), (s) => setIgnoredByStudents(s.docs.map(d => d.data() as AppNotification))));

    // Question Banks
    unsubscribes.push(onSnapshot(query(collection(db, "questionBanks"), where("facultyId", "==", currentUser.id)), (s) => {
      const banks = s.docs.map(d => d.data() as QuestionBank);
      setQuestionBanks(banks);
    }));

    return () => unsubscribes.forEach(u => u());
  }, [currentUser]);

  // --- Derived State ---
  // const userGeneratedSets = useMemo(() => allGeneratedMcqs.filter(s => s.facultyId === currentUser?.id), [allGeneratedMcqs, currentUser]);
  const studentTestHistory = useMemo(() => userAttempts, [userAttempts]);

  // --- Handlers: Auth ---
  // --- Handlers: Auth ---
  const handleLogin = async (e: string, p: string) => {
    try {
      const c = await signInWithEmailAndPassword(auth, e, p);
      if (!c.user.emailVerified) {
        await signOut(auth);
        return "Verify Email";
      }

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, "users", c.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        return "Account setup incomplete. Please contact support.";
      }

      return null;
    } catch (err: any) {
      console.error("Login Error Details:", err);
      if (err.code === 'auth/invalid-credential') return "Invalid email or password";
      if (err.code === 'auth/user-not-found') return "No user found with this email";
      if (err.code === 'auth/wrong-password') return "Incorrect password";
      if (err.code === 'auth/invalid-email') return "Invalid email address";
      return "Login Failed: " + (err.message || "Unknown error");
    }
  };
  const handleLogout = useCallback(async () => {
    // 1. Immediate UI Feedback
    setIsLoading(false);
    setCurrentUser(null);
    setFirebaseUser(null);
    setView('landing');

    // 2. Background Cleanup
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error (background):", error);
    }
  }, []);

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (e: any) {
      console.error("Forgot Password Error:", e);
      if (e.code === 'auth/user-not-found') return "Account not found.";
      return e.message;
    }
  };

  const handleRegister = async (d: RegistrationData) => {
    try {
      const q = query(collection(db, "users"), where("username", "==", d.username));
      if (!(await getDocs(q)).empty) return { success: false, error: "Username taken" };

      let u: FirebaseUser | null = null;

      if (d.googleUser) {
        u = d.googleUser;
        // Force the Auth SDK to recognize this user immediately to ensure Firestore has the token
        if (!auth.currentUser) {
          console.log("Forcefully updating current user context...");
          await auth.updateCurrentUser(d.googleUser);
        }
      } else if (auth.currentUser) {
        u = auth.currentUser;
      } else {
        u = (await createUserWithEmailAndPassword(auth, d.email, d.password!)).user;
      }

      if (!u || !auth.currentUser) {
        return { success: false, error: "Authentication session failed. Please refresh and try again." };
      }

      if (u.uid !== auth.currentUser.uid) {
        return { success: false, error: "Auth mismatch. Please sign in again." };
      }

      const nu: AppUser = { id: u.uid, username: d.username, name: d.name, email: u.email!, role: d.role, facultyId: d.username, collegeName: d.collegeName, country: d.country, state: d.state, district: d.district, isIdVerified: true, following: [], followers: [], facultyConnections: [], followersCount: 0, followingCount: 0 };
      await setDoc(doc(db, "users", u.uid), nu); setUserMetadata(p => [...p, nu]);

      if (!d.googleUser && d.password) {
        await sendEmailVerification(u);
        await signOut(auth);
        return { success: true, email: u.email!, requiresVerification: true };
      }
      return { success: true, email: u.email!, requiresVerification: false };
    } catch (e: any) {
      console.error("Registration error:", e);
      if (e.code === 'permission-denied') return { success: false, error: "Permission denied. Session may have expired." };
      return { success: false, error: e.message };
    }
  };
  const handleGoogleSignIn = async () => { try { const r = await signInWithPopup(auth, new GoogleAuthProvider()); return (await getDoc(doc(db, "users", r.user.uid))).exists() ? {} : { isNewUser: true, googleUser: r.user }; } catch { return { error: "Failed" }; } };

  // --- Handlers: Content ---
  const handleGenerateMcqs = useCallback(async (data: Omit<FormState, 'aiProvider'>) => {
    if (!currentUser) return;
    // Show loader page while generating
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateMcqs(data);

      // Create Persistent Question Bank
      const newBank: QuestionBank = {
        id: doc(collection(db, "questionBanks")).id,
        facultyId: currentUser.id,
        title: `${data.topic} (${data.difficulty})`,
        description: `Auto-generated bank for ${data.topic}. Difficulty: ${data.difficulty}. Taxonomy: ${data.taxonomy}.`,
        questions: res,
        tags: [data.topic, data.difficulty, data.taxonomy],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "questionBanks", newBank.id), newBank);

      setActiveBankId(newBank.id);
      setView('editBank');
    } catch (e: any) {
      setError(e.message);
      // If fail, go back to generator so they can try again or see error
      setView('createBank');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleCreateTestFromBank = (bank: QuestionBank) => {
    // Logic to jump to test publisher with pre-filled questions
    // For now, we can create a temporary set logic or just direct publish
    // This part might need further refinement based on "Publish Test" flow, 
    // but for now let's just create a set wrapper and invoke publish flow (or similar).

    // Simulating a set for now to reuse publish logic or we create a new publish flow.
    // Ideally "ContentLibrary" handles this. 
    // Let's just navigate to content library for now or implement direct publish modal later.
    alert("Feature coming in next step: Publish directly from Bank!");
  };

  const handlePublishTest = async (id: string, title: string, duration: number, end: string | null, mode: any, fields: any, shuffleQ: boolean, shuffleO: boolean, limit: number, allowSkip: boolean) => {
    if (!currentUser) return;
    // const set = allGeneratedMcqs.find(s => s.id === id); if (!set) return;
    const bank = questionBanks.find(b => b.id === id); if (!bank) return; // FIX: Look in questionBanks
    const newTest: Test = {
      id: doc(collection(db, "tests")).id, facultyId: currentUser.id, title, durationMinutes: duration, questions: bank.questions, endDate: end,
      studentFieldsMode: mode, customStudentFields: fields, disqualifiedStudents: [],
      shuffleQuestions: shuffleQ, shuffleOptions: shuffleO, attemptLimit: limit, allowSkip
    };

    const batch = writeBatch(db);
    batch.set(doc(db, "tests", newTest.id), newTest);

    if (currentUser.followers?.length) {
      currentUser.followers.forEach(fid => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, { id: notifRef.id, studentId: fid, studentEmail: "Follower", facultyId: currentUser.id, facultyName: currentUser.name, facultyUsername: currentUser.username, test: newTest, status: 'new', type: 'test_invite', timestamp: new Date().toISOString() });
      });
    }
    await batch.commit();
    setView('dashboard');
  };

  const handleRevokeTest = async (testId: string) => {
    if (!confirm("Delete this test?")) return;
    try {
      await deleteDoc(doc(db, "tests", testId));
      (await getDocs(query(collection(db, "notifications"), where("test.id", "==", testId)))).docs.forEach(d => deleteDoc(d.ref));
    } catch (e) { console.error(e); }
  };

  const handleViewTestAnalytics = async (test: Test) => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "testAttempts"), where("testId", "==", test.id));
      const snap = await getDocs(q);
      setTestAttempts(snap.docs.map(d => d.data() as TestAttempt));
      setAnalyticsTest(test);
      setView('testAnalytics');
    } catch (e) { console.error(e); alert("Failed to load analytics."); }
    finally { setIsLoading(false); }
  };

  // --- Handlers: Social (Atomic) ---
  // Replaced by socialService.ts and NetworkPage component
  // Cleaned up legacy handlers

  const handleSendMessage = async (targetUsername: string, message: string) => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, "users"), where("username", "==", targetUsername));
      const snap = await getDocs(q);
      if (snap.empty) { alert("User not found."); return; }
      const target = snap.docs[0].data() as AppUser;
      const ref = doc(collection(db, "notifications"));
      await setDoc(ref, {
        id: ref.id, studentId: target.id, studentEmail: target.email,
        facultyId: currentUser.id, facultyName: currentUser.name, facultyUsername: currentUser.username,
        title: "Message", message, type: 'message', status: 'new', timestamp: new Date().toISOString()
      });
      setIsMsgModalOpen(false); alert("Message sent.");
    } catch (e) { console.error(e); alert("Failed to send."); }
  };



  // --- Handlers: Career ---
  const handleUpdateCareerGoal = async (roleId: string) => {
    if (!currentUser) return;
    try {
      const goal = { targetRoleId: roleId, targetRoleTitle: roleId.replace('-', ' ').toUpperCase() };
      await updateDoc(doc(db, 'users', currentUser.id), { careerGoal: goal });
    } catch (e) {
      console.error("Failed to save career goal", e);
    }
  };

  const handleNavigate = (target: View) => {
    setError(null); setIsLoading(true);
    setTimeout(() => { setView(target); setIsLoading(false); }, 200);
    if (target === 'network' && currentUser) {
      if (currentUser.following.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.following))).then(s => setFollowingList(s.docs.map(d => d.data() as AppUser)));
      if (currentUser.followers && currentUser.followers.length) getDocs(query(collection(db, "users"), where("id", "in", currentUser.followers))).then(s => setFollowers(s.docs.map(d => d.data() as AppUser)));
    }
  };

  // --- Handlers: Execution ---
  const handleStartTest = async (test: Test, notificationId?: string) => {
    if (!currentUser) { alert("Must be logged in."); return; }
    if (test.endDate && new Date(test.endDate) < new Date()) { alert("Expired"); return; }
    if (test.disqualifiedStudents?.includes(currentUser.id)) { alert("Disqualified"); return; }

    if (test.attemptLimit && test.attemptLimit > 0) {
      const count = studentTestHistory.filter(h => h.testId === test.id).length;
      if (count >= test.attemptLimit) { alert(`Limit reached (${test.attemptLimit}).`); return; }
    }

    if (notificationId) await deleteDoc(doc(db, "notifications", notificationId));
    setActiveTest(test);
    setStudentInfo({ name: currentUser.name, registrationNumber: currentUser.username, branch: "N/A", section: "N/A", customData: {} });
    setView('studentLogin');
  };

  const handleTestFinish = async (answers: (string | null)[], violations: number, usedQuestions: MCQ[]) => {
    if (!activeTest || !currentUser || !studentInfo) return;
    const score = usedQuestions.reduce((acc, q, i) => (answers[i] === (q.correctAnswer || q.answer) ? acc + 1 : acc), 0);

    const attempt: TestAttempt = {
      id: doc(collection(db, "testAttempts")).id, testId: activeTest.id, studentId: currentUser.id, testTitle: activeTest.title,
      student: studentInfo, score, totalQuestions: usedQuestions.length, answers,
      date: new Date(), violations, questions: usedQuestions
    };

    await setDoc(doc(db, "testAttempts", attempt.id), attempt);
    setTestHistory(p => [attempt, ...p]);
    setUserAttempts(p => [attempt, ...p]);

    if (violations >= 3 && !activeTest.id.startsWith('adaptive-')) {
      await updateDoc(doc(db, "tests", activeTest.id), { disqualifiedStudents: arrayUnion(currentUser.id) });
      await setDoc(doc(collection(db, "violationAlerts")), { id: doc(collection(db, "violationAlerts")).id, studentId: currentUser.id, studentEmail: currentUser.email, facultyId: activeTest.facultyId, testId: activeTest.id, testTitle: activeTest.title, timestamp: new Date().toISOString(), status: 'pending' });
    }
    setLatestTestResult(attempt); setActiveTest(null); setView('testResults');
  };

  // --- Handlers: Manual Creator ---
  const handleManualSave = async (mcqs: MCQ[]) => {
    if (!currentUser) return;
    if (mcqs.length === 0) { alert("Add at least one question."); return; }

    const title = prompt("Enter a name for this Question Bank:", `Manual Set ${new Date().toLocaleDateString()}`);
    if (!title) return;

    setIsLoading(true);
    try {
      const newBank: QuestionBank = {
        id: doc(collection(db, "questionBanks")).id,
        facultyId: currentUser.id,
        title: title,
        description: `Manually created set with ${mcqs.length} questions.`,
        questions: mcqs,
        tags: ["Manual"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "questionBanks", newBank.id), newBank);
      setActiveBankId(newBank.id);
      setView('editBank');
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = (mcqs: MCQ[]) => {
    if (!window.jspdf) { alert("PDF library not loaded."); return; }
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(16);
    doc.text("Quizapo Assessment", 10, 10);
    doc.setFontSize(11);

    let y = 20;
    mcqs.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 10; }
      const questionText = doc.splitTextToSize(`${i + 1}. ${q.question}`, 180);
      doc.text(questionText, 10, y);
      y += 5 * questionText.length;

      q.options.forEach((opt, oi) => {
        if (y > 280) { doc.addPage(); y = 10; }
        doc.text(`   ${String.fromCharCode(65 + oi)}. ${opt}`, 10, y);
        y += 5;
      });
      y += 5;
    });

    // Answer Key
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Answer Key", 10, 10);
    doc.setFontSize(11);
    y = 20;
    mcqs.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.answer}`, 10, y);
      y += 6;
    });

    doc.save("manual-assessment.pdf");
  };

  const handleExportWord = (mcqs: MCQ[]) => {
    if (!window.docx) { alert("Docx library not loaded."); return; }
    const { Document, Packer, Paragraph, TextRun } = window.docx;

    const children = [new Paragraph({ children: [new TextRun({ text: "Quizapo Assessment", bold: true, size: 32 })] })];

    mcqs.forEach((q, i) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `\n${i + 1}. ${q.question}`, bold: true })] }));
      q.options.forEach((opt, oi) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `   ${String.fromCharCode(65 + oi)}. ${opt}` })] }));
      });
      children.push(new Paragraph({ text: "" }));
    });

    children.push(new Paragraph({ children: [new TextRun({ text: "Answer Key", bold: true, size: 28, break: 1 })] }));

    mcqs.forEach((q, i) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${q.answer}` })] }));
    });

    const doc = new Document({ sections: [{ properties: {}, children }] });

    Packer.toBlob(doc).then((blob: any) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "manual-assessment.docx";
      a.click();
    });
  };

  // --- Render ---
  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (view === 'emailVerification') return <EmailVerification email={verificationEmail} onLoginNavigate={() => setView('auth')} />;
    if (view === 'landing') return <LandingPage onGetStarted={() => setView('auth')} onNavigate={handleNavigate} />;

    // Explicit public pages for unauthenticated users
    if (['team', 'about', 'contact', 'privacy', 'terms'].includes(view)) {
      switch (view) {
        case 'team': return <TeamPage onBack={() => handleNavigate(currentUser ? 'dashboard' : 'landing')} />; // Smart back
        case 'about': return <AboutPage onBack={() => handleNavigate(currentUser ? 'dashboard' : 'landing')} onNavigate={handleNavigate} />;
        case 'contact': return <ContactPage onBack={() => handleNavigate(currentUser ? 'dashboard' : 'landing')} onNavigate={handleNavigate} />;
        case 'privacy': return <PrivacyPage onBack={() => handleNavigate(currentUser ? 'dashboard' : 'landing')} onNavigate={handleNavigate} />;
        case 'terms': return <TermsPage onBack={() => handleNavigate(currentUser ? 'dashboard' : 'landing')} onNavigate={handleNavigate} />;
      }
    }

    if (!currentUser) return <AuthPortal onLogin={handleLogin} onRegister={handleRegister} onGoogleSignIn={handleGoogleSignIn} onForgotPassword={handleForgotPassword} onRegistrationSuccess={(e) => { setVerificationEmail(e); setView('emailVerification'); }} />;

    switch (view) {
      case 'authAction':
        return authActionParams ? (
          <AuthActionHandler
            mode={authActionParams.mode}
            oobCode={authActionParams.oobCode}
            onComplete={() => setView('auth')}
          />
        ) : <LoadingSpinner />;
      case 'career':
        return <CareerPage user={currentUser} onNavigate={handleNavigate} onUpdateGoal={handleUpdateCareerGoal} />;
      case 'dashboard':
      case 'auth': // Fallback if logged in
      case 'studentPortal': case 'facultyPortal':
        return <Dashboard
          user={currentUser}
          publishedTests={publishedTests}
          questionBanks={questionBanks}
          generatedSets={[]}
          testAttempts={userAttempts}
          followersCount={currentUser.followers?.length || 0}
          followingCount={currentUser.following.length}
          onNavigate={handleNavigate}
          onStartTest={handleStartTest}
        />;

      case 'network':
        return <NetworkPage
          currentUser={currentUser}
          allUsers={allUsers}
        />;

      case 'content':
        return <ContentLibrary
          questionBanks={questionBanks}
          publishedTests={publishedTests}
          onPublishTest={handlePublishTest}
          onRevokeTest={handleRevokeTest}
          onViewTestAnalytics={(t) => handleViewTestAnalytics(t)}
          onNavigate={(v) => handleNavigate(v)}
          onEditBank={(id) => { setActiveBankId(id); setView('editBank'); }} // NEW Handler
        />;


      case 'integrity': return <IntegrityCenter violationAlerts={violationAlerts} ignoredNotifications={ignoredByStudents} onGrantReattempt={async () => { }} />;
      case 'profile': return <ProfilePage user={currentUser} onLogout={handleLogout} onBack={() => handleNavigate('dashboard')} />;

      case 'testResults':
        const questionsToShow = latestTestResult?.questions || activeTest?.questions || publishedTests.find(t => t.id === latestTestResult?.testId)?.questions || [];
        return latestTestResult ? <TestResults result={latestTestResult} questions={questionsToShow} onNavigate={handleNavigate} /> : <ErrorMessage message="No result found." />;

      case 'studentLogin': return activeTest ? <StudentLogin test={activeTest} currentUser={currentUser} onLogin={(info) => { setStudentInfo(info); setView('test'); }} /> : <ErrorMessage message="Session expired." />;
      case 'test': return (activeTest && studentInfo) ? <TestPage test={activeTest} student={studentInfo} onFinish={handleTestFinish} /> : <ErrorMessage message="Invalid Session." />;
      case 'notifications':
        return <Notifications
          notifications={notifications}
          onStartTest={handleStartTest}
          onMarkRead={async (nid) => {
            await updateDoc(doc(db, "notifications", nid), { status: 'read' });
          }}
          onDismiss={async (nid) => {
            await updateDoc(doc(db, "notifications", nid), { status: 'ignored' });
          }}
          onMarkAllRead={async () => {
            const batch = writeBatch(db);
            notifications.filter(n => n.status === 'new').forEach(n => {
              batch.update(doc(db, "notifications", n.id), { status: 'read' });
            });
            if (notifications.some(n => n.status === 'new')) await batch.commit();
          }}
          onBack={() => handleNavigate('dashboard')}
        />;

      case 'testHistory':
        return <TestHistory
          history={studentTestHistory}
          onNavigateBack={() => handleNavigate('dashboard')}
          onViewResult={(attempt) => { setLatestTestResult(attempt); setView('testResults'); }}
          onViewCertificate={(attempt) => { setSelectedCertificate(attempt); setView('certificate'); }}
        />;

      case 'certificate':
        return selectedCertificate
          ? <Certificate attempt={selectedCertificate} onBack={() => setView('testHistory')} />
          : <ErrorMessage message="No certificate selected." />;

      case 'testAnalytics':
        return analyticsTest
          ? <TestAnalytics test={analyticsTest} attempts={testAttempts} onBack={() => handleNavigate('content')} onMessageStudent={(u) => { setMsgTargetUser(u); setIsMsgModalOpen(true); }} />
          : <ErrorMessage message="Select a test." />;

      // --- NEW VIEWS ---
      case 'createBank': // Replaces 'generator'
        return <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} error={error} />; // Loading handled by global spinner now if isLoading is true

      case 'myBanks':
        return <MyBanksPage
          currentUser={currentUser}
          onNavigate={(v, id) => { if (id) setActiveBankId(id); handleNavigate(v); }}
          onCreateTest={handleCreateTestFromBank}
        />;

      case 'editBank':
        return activeBankId
          ? <EditBankPage bankId={activeBankId} onBack={() => handleNavigate('myBanks')} onSave={() => { /* Optional toast */ }} />
          : <ErrorMessage message="No bank selected." />;

      // Legacy fallback (can remove 'generator' 'results' later)
      case 'generator': return <McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} />;
      case 'results': return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><McqGeneratorForm onGenerate={handleGenerateMcqs} isLoading={false} /><div className="bg-white p-6 rounded-lg shadow">{error ? <ErrorMessage message={error} /> : <McqList mcqs={mcqs} />}</div></div>;

      case 'manualCreator':
        return <ManualMcqCreator
          onSaveSet={handleManualSave}
          onExportPDF={handleExportPDF}
          onExportWord={handleExportWord}
        />;

      // Public Pages
      case 'about': return <AboutPage onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'contact': return <ContactPage onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'privacy': return <PrivacyPage onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'terms': return <TermsPage onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'team': return <TeamPage onBack={() => handleNavigate('dashboard')} />;

      default: return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {['auth', 'emailVerification', 'test', 'studentLogin', 'landing', 'team'].includes(view) ? renderContent() : (
        <>
          <Header user={currentUser} activeView={view} onNavigate={handleNavigate} onLogout={handleLogout} notificationCount={notifications.filter(n => n.status === 'new').length} />
          <main className="container mx-auto p-4 md:p-8 animate-in fade-in duration-300">
            {renderContent()}
          </main>

          <SendNotificationModal
            isOpen={isMsgModalOpen}
            onClose={() => setIsMsgModalOpen(false)}
            onSend={handleSendMessage}
            prefilledUsername={msgTargetUser}
          />
        </>
      )}
    </div>
  );
};

export default App;