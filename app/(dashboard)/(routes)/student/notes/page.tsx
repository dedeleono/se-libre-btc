import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentNotesPage() {
  const session = await auth();
  const notes = session?.user?.id
    ? await prisma.studentNote.findMany({
        where: { userId: session.user.id },
        include: { course: true, chapter: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-sm text-muted-foreground">Your private chapter notes.</p>
      </div>
      <div className="grid gap-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader><CardTitle className="text-lg">{note.chapter.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{note.course.title}</p>
              <p>{note.content}</p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No notes yet.</CardContent></Card>}
      </div>
    </div>
  );
}
