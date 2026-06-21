"use client";

import axios from "axios";
import { CohortStatus, LiveSessionStatus } from "@prisma/client";
import { ArrowLeft, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

type Option = {
  id: string;
  title: string;
};

type LiveSessionFormData = {
  id?: string;
  title: string;
  description: string;
  status: LiveSessionStatus;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  recordingUrl?: string;
};

type CohortFormData = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  status: CohortStatus;
  capacity: string;
  startDate: string;
  endDate: string;
  courseId: string;
  learningPathId: string;
  liveSessions?: LiveSessionFormData[];
  enrollments?: { id: string; user: { name: string | null; email: string } }[];
};

interface CohortFormProps {
  initialData?: CohortFormData;
  courses: Option[];
  learningPaths: Option[];
}

const emptySession: LiveSessionFormData = {
  title: "",
  description: "",
  status: "SCHEDULED",
  startsAt: "",
  endsAt: "",
  meetingUrl: "",
};

export const CohortForm = ({ initialData, courses, learningPaths }: CohortFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const isNew = !initialData?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CohortFormData>(
    initialData || {
      title: "",
      slug: "",
      description: "",
      status: "DRAFT",
      capacity: "",
      startDate: "",
      endDate: "",
      courseId: "",
      learningPathId: "",
      liveSessions: [],
      enrollments: [],
    }
  );
  const [newSession, setNewSession] = useState<LiveSessionFormData>(emptySession);

  const saveCohort = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        status: formData.status,
        capacity: formData.capacity,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        courseId: formData.courseId || null,
        learningPathId: formData.learningPathId || null,
      };

      if (isNew) {
        const response = await axios.post("/api/cohorts", payload);
        toast.success(t.admin.cohortCreated);
        router.push(`/admin/cohorts/${response.data.id}`);
      } else {
        await axios.patch(`/api/cohorts/${initialData.id}`, payload);
        toast.success(t.admin.cohortSaved);
        router.refresh();
      }
    } catch {
      toast.error(t.admin.cohortSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCohort = async () => {
    if (!initialData?.id) return;

    try {
      setIsSaving(true);
      await axios.delete(`/api/cohorts/${initialData.id}`);
      toast.success(t.admin.cohortDeleted);
      router.push("/admin/cohorts");
      router.refresh();
    } catch {
      toast.error(t.admin.cohortDeleteError);
      setIsSaving(false);
    }
  };

  const createLiveSession = async () => {
    if (!initialData?.id || !newSession.title || !newSession.startsAt) return;

    try {
      setIsSaving(true);
      await axios.post(`/api/cohorts/${initialData.id}/live-sessions`, newSession);
      setNewSession(emptySession);
      toast.success(t.admin.liveSessionCreated);
      router.refresh();
    } catch {
      toast.error(t.admin.liveSessionCreateError);
    } finally {
      setIsSaving(false);
    }
  };

  const updateLiveSession = async (session: LiveSessionFormData) => {
    if (!session.id) return;

    try {
      setIsSaving(true);
      await axios.patch(`/api/live-sessions/${session.id}`, session);
      toast.success(t.admin.liveSessionSaved);
      router.refresh();
    } catch {
      toast.error(t.admin.liveSessionSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLiveSession = async (sessionId: string) => {
    try {
      setIsSaving(true);
      await axios.delete(`/api/live-sessions/${sessionId}`);
      toast.success(t.admin.liveSessionDeleted);
      router.refresh();
    } catch {
      toast.error(t.admin.liveSessionDeleteError);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSessionState = (sessionId: string, next: Partial<LiveSessionFormData>) => {
    setFormData((current) => ({
      ...current,
      liveSessions: (current.liveSessions || []).map((session) =>
        session.id === sessionId ? { ...session, ...next } : session
      ),
    }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/cohorts" className="flex items-center text-sm transition hover:opacity-75">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.admin.backToCohorts}
        </Link>
        {!isNew && (
          <ConfirmModal onConfirm={deleteCohort}>
            <Button variant="destructive" size="sm" disabled={isSaving}>
              <Trash className="mr-2 h-4 w-4" />
              {t.admin.deleteCohort}
            </Button>
          </ConfirmModal>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? t.admin.newCohort : t.admin.cohortDetails}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.admin.configureCohort}</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder={t.admin.title} />
            <Input value={formData.slug} onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))} placeholder={t.admin.slug} />
          </div>
          <Textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder={t.admin.description} />
          <div className="grid gap-4 md:grid-cols-3">
            <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as CohortStatus }))} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="DRAFT">{t.common.draft}</option>
              <option value="OPEN">{t.admin.open}</option>
              <option value="IN_PROGRESS">{t.admin.inProgress}</option>
              <option value="COMPLETED">{t.course.completed}</option>
              <option value="CANCELLED">{t.admin.cancelled}</option>
            </select>
            <Input value={formData.capacity} onChange={(event) => setFormData((current) => ({ ...current, capacity: event.target.value }))} placeholder={t.admin.capacity} type="number" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={formData.startDate} onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))} type="date" />
            <Input value={formData.endDate} onChange={(event) => setFormData((current) => ({ ...current, endDate: event.target.value }))} type="date" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={formData.courseId} onChange={(event) => setFormData((current) => ({ ...current, courseId: event.target.value, learningPathId: "" }))} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t.admin.noCourseTarget}</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <select value={formData.learningPathId} onChange={(event) => setFormData((current) => ({ ...current, learningPathId: event.target.value, courseId: "" }))} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">{t.admin.noLearningPathTarget}</option>
              {learningPaths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
            </select>
          </div>
          <Button onClick={saveCohort} disabled={isSaving || !formData.title.trim()}>
            {isNew ? t.admin.createCohort : t.admin.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {!isNew && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.admin.liveSessions}</CardTitle>
              <p className="text-sm text-muted-foreground">{t.admin.createEditLiveSchedule}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-md border p-3">
                <Input value={newSession.title} onChange={(event) => setNewSession((current) => ({ ...current, title: event.target.value }))} placeholder={t.admin.sessionTitle} />
                <Textarea value={newSession.description} onChange={(event) => setNewSession((current) => ({ ...current, description: event.target.value }))} placeholder={t.admin.description} />
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={newSession.startsAt} onChange={(event) => setNewSession((current) => ({ ...current, startsAt: event.target.value }))} type="datetime-local" />
                  <Input value={newSession.endsAt} onChange={(event) => setNewSession((current) => ({ ...current, endsAt: event.target.value }))} type="datetime-local" />
                  <Input value={newSession.meetingUrl} onChange={(event) => setNewSession((current) => ({ ...current, meetingUrl: event.target.value }))} placeholder={t.admin.meetingUrl} />
                </div>
                <Button onClick={createLiveSession} disabled={isSaving || !newSession.title || !newSession.startsAt}>{t.admin.addSession}</Button>
              </div>

              {(formData.liveSessions || []).map((session) => (
                <div key={session.id} className="grid gap-3 rounded-md border p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={session.title} onChange={(event) => updateSessionState(session.id!, { title: event.target.value })} />
                    <select value={session.status} onChange={(event) => updateSessionState(session.id!, { status: event.target.value as LiveSessionStatus })} className="rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="SCHEDULED">{t.admin.scheduled}</option>
                      <option value="LIVE">{t.admin.live}</option>
                      <option value="COMPLETED">{t.course.completed}</option>
                      <option value="CANCELLED">{t.admin.cancelled}</option>
                    </select>
                  </div>
                  <Textarea value={session.description} onChange={(event) => updateSessionState(session.id!, { description: event.target.value })} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input value={session.startsAt} onChange={(event) => updateSessionState(session.id!, { startsAt: event.target.value })} type="datetime-local" />
                    <Input value={session.endsAt} onChange={(event) => updateSessionState(session.id!, { endsAt: event.target.value })} type="datetime-local" />
                    <Input value={session.meetingUrl} onChange={(event) => updateSessionState(session.id!, { meetingUrl: event.target.value })} placeholder={t.admin.meetingUrl} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateLiveSession(session)} disabled={isSaving}>{t.admin.saveSession}</Button>
                    <Button variant="ghost" onClick={() => deleteLiveSession(session.id!)} disabled={isSaving}>
                      <Trash className="mr-2 h-4 w-4" />
                      {t.common.delete}
                    </Button>
                  </div>
                </div>
              ))}
              {(formData.liveSessions || []).length === 0 && (
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">{t.admin.noLiveSessionsYet}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.admin.enrolledStudents}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(formData.enrollments || []).map((enrollment) => (
                <div key={enrollment.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{enrollment.user.name || enrollment.user.email}</p>
                  <p className="text-muted-foreground">{enrollment.user.email}</p>
                </div>
              ))}
              {(formData.enrollments || []).length === 0 && (
                <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">{t.admin.noStudentsEnrolledYet}</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
