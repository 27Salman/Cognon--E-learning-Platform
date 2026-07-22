const { HTTP_STATUS } = require("../config/constants");

const throwValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = HTTP_STATUS.BAD_REQUEST;
  throw error;
};

const validateQuizData = (data) => {
  const {
    title,
    duration,
    passingMarks,
    questions,
    shuffleQuestions,
    shuffleOptions,
  } = data;
  if (!title || typeof title !== "string" || !title.trim())
    throwValidationError("Quiz title is required.");
  if (!duration || duration <= 0)
    throwValidationError("Duration must be greater than 0.");
  if (!questions || questions.length === 0)
    throwValidationError("Please add at least one question.");
  if (shuffleQuestions !== undefined && typeof shuffleQuestions !== "boolean")
    throwValidationError("Shuffle question must be a boolean.");
  if (shuffleOptions !== undefined && typeof shuffleOptions !== "boolean")
    throwValidationError("Shuffle options must be a boolean.");

  let totalMarks = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (
      !q.questionText ||
      typeof q.questionText !== "string" ||
      !q.questionText.trim()
    )
      throwValidationError(`Question ${i + 1} text is required.`);
    if (!q.marks || q.marks <= 0)
      throwValidationError(`Question ${i + 1} must have a valid mark.`);
    totalMarks += Number(q.marks);

    const filledOptions = q.options.filter(
      (opt) => opt && typeof opt === "string" && opt.trim() !== "",
    );
    if (filledOptions.length < 2)
      throwValidationError(`Question ${i + 1} must have at least 2 options.`);

    const correctOpt = q.options[q.correctOptionIndex];
    if (
      !correctOpt ||
      typeof correctOpt !== "string" ||
      correctOpt.trim() === ""
    ) {
      throwValidationError(`Question ${i + 1} correct option cannot be empty.`);
    }
  }

  if (passingMarks > totalMarks)
    throwValidationError(
      `Passing marks (${passingMarks}) cannot exceed total marks (${totalMarks}).`,
    );
  if (passingMarks < 0)
    throwValidationError("Passing marks cannot be negative.");
};

module.exports = { validateQuizData };
