// Minimal subject list derived from `syllabus.pdf` (Kongu Engineering College, B.E CSE R2024).
// Currently includes Semester I–IV theory courses for exam tagging and filtering.

(function initSyllabus() {
  const semesters = {
    "Semester I": [
      "English for Effective Communication - I",
      "Matrices and Ordinary Differential Equations",
      "Physics for Computer Systems",
      "Programming in C",
      "Problem Solving and Web Design",
      "Heritage of Tamils",
    ],
    "Semester II": [
      "English for Effective Communication - II",
      "Probability and Statistics",
      "Chemistry for Electronics and Computer Systems",
      "Programming and Linear Data Structures",
      "Object Oriented Programming using C++",
      "Tamils and Technology",
    ],
    "Semester III": [
      "Discrete Mathematical Structures",
      "Java Programming",
      "Data Structures",
      "Computer Organization",
      "Digital Logic and Design Principles",
      "Environmental Science",
    ],
    "Semester IV": [
      "Python Programming and Frameworks",
      "Full Stack Development",
      "Database Management Systems",
      "Operating Systems",
      "Design and Analysis of Algorithms",
      "Disaster Management and Preparedness",
    ],
  };

  const subjects = Array.from(
    new Set(Object.values(semesters).flat())
  ).sort((a, b) => a.localeCompare(b));

  window.SYLLABUS = { semesters, subjects };

  window.populateSubjectSelect = function populateSubjectSelect(
    selectEl,
    { includeBlank = true } = {}
  ) {
    if (!selectEl) return;

    const options = [];
    if (includeBlank) {
      options.push(`<option value=\"\" selected disabled>Select subject</option>`);
    }

    for (const subject of subjects) {
      options.push(`<option value=\"${escapeHtml(subject)}\">${escapeHtml(subject)}</option>`);
    }

    selectEl.innerHTML = options.join("");
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();

