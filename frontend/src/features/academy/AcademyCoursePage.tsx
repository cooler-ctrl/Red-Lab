import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Award, BookOpenCheck, CheckCircle2, Clock3, Play, ShieldCheck, Target } from 'lucide-react';
import { Button } from '../../components/Button';
import { academyApi, type AcademyCourseSummary } from './academyTypes';
import { AcademyHeader, Card, PageLoading } from './AcademyShared';

export function AcademyCoursePage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<AcademyCourseSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { academyApi.course(courseId).then(setCourse).catch((reason: Error) => setError(reason.message)); }, [courseId]);

  if (!course && !error) return <PageLoading label="Loading course path…" />;
  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]"><AcademyHeader active="academy" backLabel="Course overview" />
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/academy')} className="inline-flex items-center gap-2 text-xs text-[#9BA5B5] transition hover:text-white"><ArrowLeft size={14} /> Academy dashboard</button>
      {error && <div className="rounded-xl border border-[#FF3B4E]/40 bg-[#FF3B4E]/10 p-4 text-sm text-[#FFB3BB]">{error}</div>}
      {course && <>
        <section className="relative overflow-hidden rounded-2xl border border-[#293140] bg-[#11151D] p-6 sm:p-8">
          <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-[#FF3B4E]/10 blur-3xl" />
          <div className="relative">
            <span className="rounded-md border border-[#60A5FA]/30 bg-[#60A5FA]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD]">Level 1 · {course.level_name}</span>
            <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9BA5B5]">{course.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#9BA5B5]"><span className="inline-flex items-center gap-1.5"><BookOpenCheck size={14} className="text-[#60A5FA]" /> 10 lessons</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> About {course.estimated_hours} hours</span><span className="inline-flex items-center gap-1.5"><Target size={14} className="text-[#F5C451]" /> 20-question final exam</span></div>
            <div className="mt-6 max-w-xl"><div className="flex justify-between text-xs"><span className="text-[#9BA5B5]">Course progress</span><strong>{course.completed_lessons}/10 · {course.progress_percent}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0B0D12]"><div className="h-full rounded-full bg-[#FF3B4E] transition-all" style={{ width: `${course.progress_percent}%` }} /></div></div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {!course.completed && course.exam_unlocked && <Button variant="primary" icon={<Target size={15} />} onClick={() => navigate(`/academy/courses/${course.slug}/exam`)}>{course.latest_exam ? 'Retake final examination' : 'Start final examination'}</Button>}
              {course.completed && course.certificate && <Button variant="primary" icon={<Award size={15} />} onClick={() => navigate(`/academy/certificates/${course.certificate?.id}`)}>View certificate</Button>}
              {course.latest_exam && <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${course.latest_exam.passed ? 'border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]' : 'border-[#FF8A4C]/25 bg-[#FF8A4C]/10 text-[#FFB77D]'}`}>{course.latest_exam.passed ? 'Passed' : 'Needs another attempt'} · {course.latest_exam.score}%</span>}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">Course curriculum</p><h2 className="mt-1 text-xl font-bold">10 lessons to complete</h2><p className="mt-1 text-sm text-[#9BA5B5]">Work through each lesson and its knowledge checks. Your progress is saved automatically.</p></div>
          <div className="space-y-2">
            {course.lessons.map((lesson) => <button key={lesson.id} onClick={() => navigate(`/academy/courses/${course.slug}/lessons/${lesson.slug}`)} className="group flex w-full items-center gap-4 rounded-xl border border-[#293140] bg-[#11151D] p-4 text-left transition hover:border-[#FF3B4E]/45 hover:bg-[#141923] sm:p-5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${lesson.completed ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#171C26] text-[#9BA5B5]'}`}>{lesson.completed ? <CheckCircle2 size={18} /> : String(lesson.order).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{lesson.title}</span><span className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#9BA5B5]"><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {lesson.duration_minutes} min</span>{lesson.lab_kind && <span className="inline-flex items-center gap-1 text-[#60A5FA]"><ShieldCheck size={11} /> Simulation exercise</span>}{lesson.completed && <span className="text-[#34D399]">Completed</span>}</span></span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171C26] text-[#9BA5B5] transition group-hover:bg-[#FF3B4E]/10 group-hover:text-[#FF8A4C]"><ArrowRight size={15} /></span>
            </button>)}
          </div>
        </section>

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-semibold">A safe place to practice</h3><p className="mt-1 text-xs leading-relaxed text-[#9BA5B5]">Practical exercises open RedLab's local network simulator with a fictional environment. No external systems are contacted.</p></div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#34D399]/20 bg-[#34D399]/5 px-3 py-2 text-[11px] text-[#34D399]"><ShieldCheck size={14} /> Isolated simulation</span>
        </Card>
      </>}
    </main>
  </div>;
}

export default AcademyCoursePage;
