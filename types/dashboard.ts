interface StudentScore {
    score: number;
    submittedAt: Date;
    assignment: {
        title: string;
        maxPoints: number;
    };
}

interface StudentLevel {
    id: string;
    name: string;
    position: number;
}

interface StudentData {
    id: string;
    firstName: string | null;
    name: string | null;
    email: string;
    studentCourses: {
        course: {
            id: string;
            title: string;
        };
    }[];
    submissions: {
        id: string;
        status: "PENDING" | "SUBMITTED" | "GRADED";
        assignment: {
            id: string;
            title: string;
        };
    }[];
    assignmentScores: StudentScore[];
    studentLevel: StudentLevel | null;
    levelScores: {
        score: number;
        level: StudentLevel;
    }[];
}