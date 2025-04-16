import {
  auth,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  collection,
  getDocs,
} from "./firebase-config.js";

async function checkAdminRole(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() && userDocSnap.data().role === "admin";
}

async function getStudentData() {
  const studentRef = collection(db, "students");
  const snapshot = await getDocs(studentRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      name: data.name || "",
      contact: data.contact || "",
      applicationNumber: data.applicationNumber || "",
      remarks: data.remarks || "",
      submittedBy: data.submittedBy || "",
      lastUpdatedBy: data.lastUpdatedBy || "",
      timestamp: data.timestamp?.toDate().toISOString() || "",
      lastUpdatedTime: data.lastUpdatedTime?.toDate().toISOString() || "",
      commerce_option: parseInt(data.pvhssOptionCommerce) || 0,
      science_option: parseInt(data.pvhssOptionScience) || 0,
    };
  });
}

async function sendToFlask(students) {
  const response = await fetch(
    "https://admissiondataanalysis-989444157242.us-central1.run.app/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(students),
    }
  );

  return await response.json(); // Expected format: { insights: [...] }
}

function displayAnalysis(results) {
  const container = document.getElementById("analysis-results");
  container.innerHTML = "";

  results.insights.forEach((insight) => {
    const card = document.createElement("div");
    card.className = "analysis-card";
    card.innerHTML = `<h2>${insight.title}</h2><p>${insight.description}</p>`;
    container.appendChild(card);
  });
}

function showAccessDenied() {
  const container = document.getElementById("analysis-results");
  container.innerHTML = `<h2 style="color: red;">Access Denied: Admins Only</h2>`;
}

async function runAnalysisFlow() {
  const students = await getStudentData();
  const results = await sendToFlask(students);
  displayAnalysis(results);
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isAdmin = await checkAdminRole(user);
    if (isAdmin) {
      runAnalysisFlow();
    } else {
      showAccessDenied();
    }
  } else {
    window.location.href = "index.html";
  }
});
