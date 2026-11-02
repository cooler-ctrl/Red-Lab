import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock3, Flame, GraduationCap, LockKeyhole, Medal, Pencil, Play, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import { Button } from '../../components/Button';
import { academyApi, type AcademyDashboardData } from './academyTypes';
import { AcademyHeader, Card, CircularProgress, PageLoading, formatDate } from './AcademyShared';

const levels = [
  { key: 'beginner', title: 'Beginner', subtitle: 'Build the foundations', accent: '#60A5FA' },
  { key: 'intermediate', title: 'Intermediate', subtitle: 'Strengthen technical skills', accent: '#34D399' },
  { key: 'advanced', title: 'Advanced', subtitle: 'Practice professional workflows', accent: '#F5C451' },
  { key: 'expert', title: 'Senior / Expert', subtitle: 'Lead security programs', accent: '#FF8A4C' },
];

const achievementTitles: Record<string, { title: string; description: string }> = {
  first_lesson: { title: 'First steps', description: 'Completed your first lesson' },
  ten_lessons: { title: 'Committed learner', description: 'Completed 10 lessons' },
  first_course: { title: 'First course completed', description: 'Passed a course examination' },
  beginner_level: { title: 'Beginner level completed', description: 'Mastered the cybersecurity foundations path' },
  perfect_score: { title: 'Perfect score', description: 'Earned 100% on an examination' },
  seven_day_streak: { title: 'Seven day streak', description: 'Learned on seven consecutive days' },
};

export function AcademyDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AcademyDashboardData | null>(null);
  const [error, setError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [activeExam, setActiveExam] = useState<string | null>(null);

  const refresh = async () => {
    const result = await academyApi.dashboard();
    setData(result);
    setName(result.student_name);
  };

  useEffect(() => {
    refresh().catch((reason: Error) => setError(reason.message));
    academyApi.activeExam().then((exam) => setActiveExam(exam?.id ?? null)).catch(() => setActiveExam(null));
  }, []);

  const levelIndex = useMemo(() => {
    const level = data?.current_level.toLowerCase();
    if (level === 'beginner') return 0;
    if (level === 'intermediate') return 1;
    if (level === 'advanced') return 2;
    return 3;
  }, [data?.current_level]);

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      const profile = await academyApi.saveName(name.trim());
      setName(profile.student_name);
      setEditingName(false);
      await refresh();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSavingName(false);
    }
  };

  if (!data && !error) return <PageLoading label="Opening RED-Lab Academy…" />;

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]">
      <AcademyHeader active="academy" />
      <main className="max-w-7xl mx-auto px-4 py-7 sm:px-6 lg:px-8 space-y-7">
        {error && <div className="rounded-xl border border-[#FF3B4E]/40 bg-[#FF3B4E]/10 p-4 text-sm text-[#FFB3BB]">{error}</div>}
        {data && <>
          <section className="relative overflow-hidden rounded-2xl border border-[#293140] bg-[#11151D] p-6 sm:p-8">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#FF3B4E]/10 blur-3xl" />
            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#FF3B4E]/25 bg-[#FF3B4E]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#FF8A4C]"><GraduationCap size={14} /> RED-Lab Academy</div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {data.student_name}</h1>
                  <button onClick={() => setEditingName(!editingName)} className="rounded-lg p-2 text-[#9BA5B5] transition hover:bg-[#171C26] hover:text-white" title="Edit student name"><Pencil size={15} /></button>
                </div>
                {editingName && <div className="mt-3 flex max-w-md gap-2"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="min-w-0 flex-1 rounded-lg border border-[#293140] bg-[#0B0D12] px-3 py-2 text-sm outline-none focus:border-[#FF3B4E]" /><Button onClick={saveName} loading={savingName} size="sm" variant="primary">Save name</Button></div>}
                <p className="mt-2 text-sm leading-relaxed text-[#9BA5B5]">Learn the principles behind safer systems, then practice them in RedLab's local network simulator.</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#293140] bg-[#171C26] px-3 py-2 text-xs text-[#CBD2DC]"><ShieldCheck size={15} className="text-[#34D399]" /> Current level: <strong className="text-white">{data.current_level}</strong></span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#293140] bg-[#171C26] px-3 py-2 text-xs text-[#CBD2DC]"><Flame size={15} className="text-[#FF8A4C]" /> {data.learning_streak} day streak</span>
                  {activeExam && <Button size="sm" variant="primary" icon={<Play size={14} />} onClick={() => navigate(`/academy/exams/${activeExam}`)}>Resume examination</Button>}
                </div>
              </div>
              <div className="flex items-center gap-5 rounded-xl border border-[#293140] bg-[#171C26]/90 p-4 sm:p-5">
                <CircularProgress value={data.overall_progress} size={104} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9BA5B5]">Academy progress</p>
                  <p className="mt-1 text-2xl font-bold">{data.overall_progress}%</p>
                  <p className="mt-1 text-xs text-[#9BA5B5]">{data.completed_lessons} of {data.total_lessons} lessons</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#34D399]"><CheckCircle2 size={13} /> {data.completed_courses} courses passed</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<BookOpen size={17} />} label="Lessons completed" value={`${data.completed_lessons}/${data.total_lessons}`} detail="Your learning path" color="#60A5FA" />
            <StatCard icon={<Target size={17} />} label="Average exam score" value={data.average_exam_score === null ? '—' : `${data.average_exam_score}%`} detail={`${data.exam_attempts.length} submitted attempt${data.exam_attempts.length === 1 ? '' : 's'}`} color="#F5C451" />
            <StatCard icon={<Flame size={17} />} label="Learning streak" value={`${data.learning_streak} days`} detail="Keep your momentum" color="#FF8A4C" />
            <StatCard icon={<Award size={17} />} label="Certificates" value={String(data.certificates.length)} detail="Courses successfully passed" color="#34D399" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">Your course</p><h2 className="mt-1 text-xl font-bold">{data.courses[0]?.title ?? 'No course available'}</h2><p className="mt-1 max-w-2xl text-sm text-[#9BA5B5]">{data.courses[0]?.description}</p></div>
                <span className="rounded-md border border-[#60A5FA]/30 bg-[#60A5FA]/10 px-2.5 py-1 text-[11px] font-semibold text-[#93C5FD]">{data.courses[0]?.level_name ?? 'Beginner'}</span>
              </div>
              {data.courses[0] && <>
                <div className="mt-5 flex items-center justify-between text-xs"><span className="text-[#9BA5B5]">{data.courses[0].completed_lessons} of 10 lessons</span><span className="font-semibold text-white">{data.courses[0].progress_percent}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0B0D12]"><div className="h-full rounded-full bg-gradient-to-r from-[#FF3B4E] to-[#FF8A4C] transition-all" style={{ width: `${data.courses[0].progress_percent}%` }} /></div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {data.courses[0].lessons.map((lesson) => <Link key={lesson.id} to={`/academy/courses/${data.courses[0].slug}/lessons/${lesson.slug}`} className="flex items-center gap-3 rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-3 transition hover:border-[#FF3B4E]/50 hover:bg-[#171C26]">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${lesson.completed ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-[#171C26] text-[#9BA5B5]'}`}>{lesson.completed ? <CheckCircle2 size={15} /> : String(lesson.order).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{lesson.title}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-[#9BA5B5]"><Clock3 size={11} /> {lesson.duration_minutes} min</span></span>
                    <ArrowRight size={14} className="text-[#596477]" />
                  </Link>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="primary" size="md" icon={<BookOpen size={15} />} onClick={() => navigate(`/academy/courses/${data.courses[0].slug}`)}>{data.courses[0].completed_lessons ? 'Continue course' : 'Start course'}</Button>
                  {data.courses[0].exam_unlocked && !data.courses[0].completed && <Button variant="secondary" size="md" icon={<Target size={15} />} onClick={() => navigate(`/academy/courses/${data.courses[0].slug}/exam`)}>Take final examination</Button>}
                  {data.courses[0].completed && data.courses[0].certificate && <Button variant="secondary" size="md" icon={<Award size={15} />} onClick={() => navigate(`/academy/certificates/${data.courses[0].certificate?.id}`)}>View certificate</Button>}
                </div>
              </>}
            </Card>

            <div className="space-y-6">
              <Card className="p-5">
                <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60A5FA]">Next up</p><h2 className="mt-1 text-base font-bold">Recommended lesson</h2></div><Sparkles size={19} className="text-[#F5C451]" /></div>
                {data.recommended_lesson ? <>
                  <p className="mt-4 text-sm font-semibold">{data.recommended_lesson.lesson_title}</p><p className="mt-1 text-xs text-[#9BA5B5]">{data.recommended_lesson.course_title}</p>
                  <Button className="mt-4 w-full" variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate(`/academy/courses/${data.recommended_lesson?.course_slug}/lessons/${data.recommended_lesson?.lesson_id}`)}>Pick up learning</Button>
                </> : <p className="mt-4 text-sm text-[#9BA5B5]">You have completed every available lesson.</p>}
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#34D399]">Activity</p><h2 className="mt-1 text-base font-bold">Last 7 days</h2></div><span className="text-[10px] text-[#9BA5B5]">Lessons finished</span></div>
                <div className="mt-5 flex h-24 items-end justify-between gap-2" aria-label="Lessons completed each of the last seven days">
                  {data.activity.map((day) => <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex w-full flex-1 items-end justify-center"><div title={`${day.completed} lessons`} className={`w-full max-w-7 rounded-t-md transition-all ${day.completed ? 'bg-[#34D399]' : 'bg-[#293140]'}`} style={{ height: `${Math.max(8, Math.min(100, day.completed * 27))}%` }} /></div><span className="text-[9px] text-[#748095]">{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span></div>)}
                </div>
              </Card>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">Learning path</p><h2 className="mt-1 text-xl font-bold">Four levels. One step at a time.</h2></div><span className="hidden text-xs text-[#9BA5B5] sm:block">Pass each course examination to advance</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {levels.map((level, index) => {
                const unlocked = index <= levelIndex;
                return <Card key={level.key} className={`p-4 ${unlocked ? 'border-[#293140]' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${level.accent}18`, color: level.accent }}>{unlocked ? <GraduationCap size={18} /> : <LockKeyhole size={17} />}</span><span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: unlocked ? level.accent : '#748095' }}>{unlocked ? (index === levelIndex ? 'Current level' : 'Unlocked') : 'Locked'}</span></div>
                  <h3 className="mt-3 text-sm font-semibold">Level {index + 1} · {level.title}</h3><p className="mt-1 text-xs text-[#9BA5B5]">{level.subtitle}</p>
                  <div className="mt-4 h-1.5 rounded-full bg-[#0B0D12]"><div className="h-full rounded-full" style={{ backgroundColor: level.accent, width: index < levelIndex ? '100%' : index === levelIndex ? `${data.overall_progress}%` : '0%' }} /></div>
                </Card>;
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2"><Trophy size={18} className="text-[#F5C451]" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5C451]">Milestones</p><h2 className="text-base font-bold">Achievements</h2></div></div>
              {data.achievements.length ? <div className="mt-4 space-y-2">{data.achievements.map((achievement) => { const detail = achievementTitles[achievement.key] ?? { title: achievement.key, description: '' }; return <div key={achievement.key} className="flex items-center gap-3 rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5C451]/10 text-[#F5C451]"><Medal size={17} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{detail.title}</span><span className="mt-0.5 block text-[11px] text-[#9BA5B5]">{detail.description}</span></span><span className="text-[10px] text-[#748095]">{formatDate(achievement.earned_at)}</span></div>; })}</div> : <div className="mt-4 rounded-lg border border-dashed border-[#293140] p-6 text-center text-xs text-[#9BA5B5]">Complete lessons and pass your first examination to earn milestones.</div>}
            </Card>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2"><Target size={18} className="text-[#60A5FA]" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60A5FA]">Assessment record</p><h2 className="text-base font-bold">Examination results</h2></div></div>
              {data.exam_attempts.length ? <div className="mt-4 space-y-2">{data.exam_attempts.slice(0, 5).map((attempt, index) => <div key={`${attempt.submitted_at}-${index}`} className="flex items-center gap-3 rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${attempt.passed ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#FF3B4E]/10 text-[#FF8A4C]'}`}>{attempt.score}%</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{attempt.course_title}</span><span className="mt-0.5 block text-[10px] text-[#9BA5B5]">{formatDate(attempt.submitted_at)}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${attempt.passed ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#FF3B4E]/10 text-[#FF8A4C]'}`}>{attempt.passed ? 'Passed' : 'Retry'}</span></div>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-[#293140] p-6 text-center text-xs text-[#9BA5B5]">Your exam scores will appear here when you submit your first examination.</div>}
            </Card>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#34D399]">Recognition</p><h2 className="mt-1 text-xl font-bold">Certificates</h2></div></div>
            {data.certificates.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.certificates.map((certificate) => <Link key={certificate.id} to={`/academy/certificates/${certificate.id}`} className="group rounded-xl border border-[#293140] bg-[#11151D] p-4 transition hover:border-[#F5C451]/50"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5C451]/10 text-[#F5C451]"><Award size={20} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{certificate.student_name}</strong><span className="block text-xs text-[#9BA5B5]">{certificate.score}% · {formatDate(certificate.issued_at)}</span></span><ArrowRight size={15} className="text-[#748095] transition group-hover:translate-x-1" /></div></Link>)}</div> : <Card className="p-5 text-sm text-[#9BA5B5]">Complete the 10 lessons and pass the final examination to earn your first RED-Lab Academy certificate.</Card>}
          </section>
        </>}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, detail, color }: { icon: ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Card className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}17`, color }}>{icon}</span><span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wide text-[#9BA5B5]">{label}</span><strong className="mt-0.5 block text-xl">{value}</strong><span className="mt-0.5 block truncate text-[10px] text-[#748095]">{detail}</span></span></Card>;
}

export default AcademyDashboard;
