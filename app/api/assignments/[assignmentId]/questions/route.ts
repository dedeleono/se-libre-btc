import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

interface CreateQuestionDTO {
    content: string;
    type: QuestionType;
    points: number;
    options?: string[];
    correctOption?: string | null;
    matchingData?: {
        prompts: { id: string; content: string; position: number }[];
        choices: { id: string; content: string; position: number }[];
        pairs: { promptId: string; choiceId: string }[];
        config: {
            scoringPolicy: "ALL_OR_NOTHING" | "PARTIAL_PER_PAIR" | "PARTIAL_WITH_PENALTY";
            allowReuse: boolean;
            shuffleChoices: boolean;
        };
    };
}

interface QuestionResponse {
    id: string;
    position: number;
    content: string;
    type: QuestionType;
    points: number;
    correctOption: string | null;
    assignmentId: string;
    options: {
        id: string;
        content: string;
        questionId: string;
    }[];
    matchingConfig?: {
        id: string;
        scoringPolicy: string;
        allowReuse: boolean;
        shuffleChoices: boolean;
    };
    matchingPrompts?: {
        id: string;
        content: string;
        position: number;
    }[];
    matchingChoices?: {
        id: string;
        content: string;
        position: number;
    }[];
    matchingPairs?: {
        id: string;
        promptId: string;
        choiceId: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export async function POST(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const values = await req.json() as CreateQuestionDTO;
        const { content, type, points, options, correctOption, matchingData } = values;

        // Get the highest position
        const lastQuestion = await prisma.question.findFirst({
            where: {
                assignmentId: params.assignmentId,
            },
            orderBy: {
                position: 'desc',
            },
        });

        const position = lastQuestion ? lastQuestion.position + 1 : 1;

        // Create the base question
        const questionData = {
            content,
            type,
            points,
            position,
            correctOption,
            assignmentId: params.assignmentId,
            ...(options && (type === "MULTIPLE_CHOICE" || type === "FILL_IN_THE_BLANK") && {
                options: {
                    create: options.map((option: any) => ({
                        content: typeof option === 'string' ? option : option.content,
                        ...(typeof option !== 'string' && {
                            hasBlank: option.hasBlank || false,
                            blankPlaceholder: option.blankPlaceholder || null,
                            correctBlankText: option.correctBlankText || null,
                        }),
                    })),
                },
            }),
            // For matching questions
            ...(type === "MATCHING" && matchingData && {
                matchingConfig: {
                    create: {
                        scoringPolicy: matchingData.config.scoringPolicy,
                        allowReuse: matchingData.config.allowReuse,
                        shuffleChoices: matchingData.config.shuffleChoices
                    }
                },
                matchingPrompts: {
                    create: matchingData.prompts.map(prompt => ({
                        content: prompt.content,
                        position: prompt.position
                    }))
                },
                matchingChoices: {
                    create: matchingData.choices.map(choice => ({
                        content: choice.content,
                        position: choice.position
                    }))
                }
            })
        };

        const question = await prisma.question.create({
            data: questionData,
            include: {
                options: true,
                matchingConfig: true,
                matchingPrompts: true,
                matchingChoices: true,
            },
        });
        
        // If this is a matching question, create the matching pairs
        if (type === "MATCHING" && matchingData) {
            // We need to map the client-side IDs to the database IDs
            const promptMap = new Map();
            const choiceMap = new Map();
            
            question.matchingPrompts?.forEach(dbPrompt => {
                // Find the corresponding client prompt by position
                const clientPrompt = matchingData.prompts.find(p => p.position === dbPrompt.position);
                if (clientPrompt) {
                    promptMap.set(clientPrompt.id, dbPrompt.id);
                }
            });
            
            question.matchingChoices?.forEach(dbChoice => {
                // Find the corresponding client choice by position
                const clientChoice = matchingData.choices.find(c => c.position === dbChoice.position);
                if (clientChoice) {
                    choiceMap.set(clientChoice.id, dbChoice.id);
                }
            });
            
            // Create the matching pairs
            const pairsToCreate = matchingData.pairs.map(pair => ({
                questionId: question.id,
                promptId: promptMap.get(pair.promptId),
                choiceId: choiceMap.get(pair.choiceId)
            }));
            
            if (pairsToCreate.length > 0) {
                await prisma.matchingPair.createMany({
                    data: pairsToCreate
                });
            }
            
            // Fetch the created pairs
            const matchingPairs = await prisma.matchingPair.findMany({
                where: {
                    questionId: question.id
                }
            });
            
            // Add the pairs to the response (not directly to the question object)
            Object.assign(question, { matchingPairs });
        }

        // Create a clean response object with type safety
        const response: QuestionResponse = {
            id: question.id,
            position: question.position,
            content: question.content,
            type: question.type,
            points: question.points,
            correctOption: question.correctOption,
            assignmentId: question.assignmentId,
            options: question.options,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
        };
        
        // Add matching-specific properties if they exist
        if (question.matchingConfig) {
            response.matchingConfig = question.matchingConfig;
        }
        
        if (question.matchingPrompts) {
            response.matchingPrompts = question.matchingPrompts;
        }
        
        if (question.matchingChoices) {
            response.matchingChoices = question.matchingChoices;
        }
        
        // Add the matching pairs if they were created
        if ('matchingPairs' in question) {
            response.matchingPairs = question.matchingPairs as any;
        }
        
        // Log the response for debugging
        console.log("Question response:", JSON.stringify({
            id: response.id,
            type: response.type,
            matchingConfig: response.matchingConfig ? true : false,
            matchingPrompts: response.matchingPrompts ? response.matchingPrompts.length : 0,
            matchingChoices: response.matchingChoices ? response.matchingChoices.length : 0,
            matchingPairs: response.matchingPairs ? response.matchingPairs.length : 0
        }, null, 2));

        return NextResponse.json(response);
    } catch (error) {
        console.error("[QUESTIONS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { questions } = await req.json();

        for (const item of questions) {
            await prisma.question.update({
                where: { id: item.id },
                data: { position: item.position }
            });
        }

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.error("[REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const questions = await prisma.question.findMany({
            where: {
                assignmentId: params.assignmentId,
            },
            include: {
                options: true,
                matchingConfig: true,
                matchingPrompts: true,
                matchingChoices: true,
                matchingPairs: true
            },
            orderBy: {
                position: 'asc',
            },
        });
        
        // Log the questions for debugging
        console.log("Questions fetched:", questions.map(q => ({
            id: q.id,
            type: q.type,
            matchingConfig: q.matchingConfig ? true : false,
            matchingPrompts: q.matchingPrompts ? q.matchingPrompts.length : 0,
            matchingChoices: q.matchingChoices ? q.matchingChoices.length : 0,
            matchingPairs: q.matchingPairs ? q.matchingPairs.length : 0
        })));

        return NextResponse.json(questions);
    } catch (error) {
        console.error("[QUESTIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}