const API_BASE = '/api';
const TOKEN_KEY = 'mlms_token';
const USER_KEY = 'mlms_user';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
}
function setUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function clearUser() { localStorage.removeItem(USER_KEY); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body, e.g. some DELETEs */ }

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('POST', '/auth/register', payload),
  login: (payload) => request('POST', '/auth/login', payload),
  me: () => request('GET', '/auth/me'),

  // courses
  listCourses: () => request('GET', '/courses'),
  getCourse: (courseId) => request('GET', `/courses/${courseId}`),
  createCourse: (payload) => request('POST', '/courses', payload),
  updateCourse: (courseId, payload) => request('PUT', `/courses/${courseId}`, payload),
  deleteCourse: (courseId) => request('DELETE', `/courses/${courseId}`),
  enroll: (courseId) => request('POST', `/courses/${courseId}/enroll`),
  myEnrolledCourses: () => request('GET', '/courses/me/enrolled'),

  // modules & lessons (authoring)
  addModule: (courseId, payload) => request('POST', `/courses/${courseId}/modules`, payload),
  updateModule: (moduleId, payload) => request('PUT', `/courses/modules/${moduleId}`, payload),
  deleteModule: (moduleId) => request('DELETE', `/courses/modules/${moduleId}`),
  addLesson: (moduleId, payload) => request('POST', `/courses/modules/${moduleId}/lessons`, payload),
  updateLesson: (lessonId, payload) => request('PUT', `/courses/lessons/${lessonId}`, payload),
  deleteLesson: (lessonId) => request('DELETE', `/courses/lessons/${lessonId}`),

  // progress
  completeLesson: (lessonId) => request('POST', `/progress/lessons/${lessonId}/complete`),
  courseProgress: (courseId) => request('GET', `/progress/courses/${courseId}`),
  myProgress: () => request('GET', '/progress/me'),

  // quizzes
  getQuizForLesson: (lessonId) => request('GET', `/quizzes/lesson/${lessonId}`),
  submitQuizAttempt: (quizId, answers) => request('POST', `/quizzes/${quizId}/attempts`, { answers }),
  myQuizAttempts: (quizId) => request('GET', `/quizzes/${quizId}/attempts/me`),
  addQuestion: (quizId, payload) => request('POST', `/quizzes/${quizId}/questions`, payload),
  updateQuestion: (questionId, payload) => request('PUT', `/quizzes/questions/${questionId}`, payload),
  deleteQuestion: (questionId) => request('DELETE', `/quizzes/questions/${questionId}`),

  // assignments
  getAssignmentForLesson: (lessonId) => request('GET', `/assignments/lesson/${lessonId}`),
  submitAssignment: (assignmentId, payload) => request('POST', `/assignments/${assignmentId}/submissions`, payload),
  listSubmissions: (assignmentId) => request('GET', `/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, payload) => request('PUT', `/assignments/submissions/${submissionId}/grade`, payload),

  // certificates
  myCertificates: () => request('GET', '/certificates/me'),
  getCertificate: (certificateId) => request('GET', `/certificates/${certificateId}`),
  issueCertificate: (courseId) => request('POST', `/certificates/courses/${courseId}/issue`),
  verifyCertificate: (code) => request('GET', `/certificates/verify/${code}`),

  token: { get: getToken, set: setToken, clear: clearToken },
  user: { get: getUser, set: setUser, clear: clearUser },
};

/** Redirects to the landing page if not logged in; otherwise returns the cached user. */
export function requireAuth(redirectTo = 'index.html') {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

export function logout(redirectTo = 'index.html') {
  clearToken();
  clearUser();
  window.location.href = redirectTo;
}

export function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
