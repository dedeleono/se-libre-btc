-- Mark a quiz as the course's final exam (used to gate certificate eligibility).
ALTER TABLE "Quiz" ADD COLUMN "isFinalExam" BOOLEAN NOT NULL DEFAULT false;
