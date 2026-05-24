import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

// Add type safety to the values object
interface UpdateQuestionDTO {
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

export async function PATCH(
    req: Request,
    { params }: { params: { assignmentId: string; questionId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const values = await req.json() as UpdateQuestionDTO;
        const { content, type, points, options, correctOption, matchingData } = values;

        console.log("Updating question with matching data:", matchingData ? {
            prompts: matchingData.prompts.length,
            choices: matchingData.choices.length,
            pairs: matchingData.pairs.length
        } : "No matching data");

        // Delete existing options for multiple choice questions
        if (type === "MULTIPLE_CHOICE") {
            await prisma.questionOption.deleteMany({
                where: {
                    questionId: params.questionId,
                },
            });
        }

        // Delete existing matching data if this is a matching question
        if (type === "MATCHING") {
            // Delete existing matching pairs
            await prisma.matchingPair.deleteMany({
                where: {
                    questionId: params.questionId,
                },
            });

            // Delete existing matching prompts
            await prisma.matchingPrompt.deleteMany({
                where: {
                    questionId: params.questionId,
                },
            });

            // Delete existing matching choices
            await prisma.matchingChoice.deleteMany({
                where: {
                    questionId: params.questionId,
                },
            });

            // Delete existing matching config
            await prisma.matchingConfig.deleteMany({
                where: {
                    questionId: params.questionId,
                },
            });
        }

        // Update the question with basic data
        const question = await prisma.question.update({
            where: {
                id: params.questionId,
                assignmentId: params.assignmentId,
            },
            data: {
                content,
                type,
                points,
                correctOption,
                ...(options && type === "MULTIPLE_CHOICE" && {
                    options: {
                        create: options.map((option: string) => ({
                            content: option,
                        })),
                    },
                }),
                // For matching questions, create new matching data
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
                }),
            },
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
            })).filter(pair => pair.promptId && pair.choiceId); // Filter out any invalid pairs
            
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
            
            // Add the pairs to the response
            Object.assign(question, { matchingPairs });
        }

        // Create a clean response with all matching data
        const response = {
            ...question,
            matchingPairs: 'matchingPairs' in question ? question.matchingPairs : []
        };
        
        console.log("Returning updated question:", {
            id: response.id,
            type: response.type,
            matchingConfig: response.matchingConfig ? true : false,
            matchingPrompts: response.matchingPrompts ? response.matchingPrompts.length : 0,
            matchingChoices: response.matchingChoices ? response.matchingChoices.length : 0,
            matchingPairs: Array.isArray(response.matchingPairs) ? response.matchingPairs.length : 0
        });
        
        return NextResponse.json(response);
    } catch (error) {
        console.error("[QUESTION_ID]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { assignmentId: string; questionId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const question = await prisma.question.delete({
            where: {
                id: params.questionId,
                assignmentId: params.assignmentId,
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUESTION_ID_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}