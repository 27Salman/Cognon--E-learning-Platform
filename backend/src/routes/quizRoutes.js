const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { protect } = require("../middleware/authMiddleware");
const { tutorOnly, studentOnly } = require("../middleware/roleMiddleware");

router.use(protect);

router.post("/", tutorOnly, quizController.createQuiz);
router.put("/:quizId", tutorOnly, quizController.updateQuiz);
router.get("/course/:courseId", tutorOnly, quizController.getQuizByCourse);

router.get(
  "/course/:courseId/student",
  studentOnly,
  quizController.getStudentQuizStatus,
);
router.post("/:quizId/attempts", studentOnly, quizController.startAttempt);
router.put("/attempts/:attemptId", studentOnly, quizController.autosaveAttempt);
router.post(
  "/attempts/:attemptId/submit",
  studentOnly,
  quizController.submitAttempt,
);

module.exports = router;
