import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Cloud, Database, Eye, Fingerprint, Globe2, LockKeyhole, Mail, Network, Shield, ShieldCheck, Workflow } from 'lucide-react';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { createExampleNetworkLab } from '../../services/exampleNetworkLab';
import { useLabStore } from '../../stores/labStore';
import { LocalLessonVideo } from './LocalLessonVideo';
import { academyApi, type AcademyCourseSummary, type AcademyLesson } from './academyTypes';
import { AcademyHeader, Card, PageLoading } from './AcademyShared';

export function AcademyLessonPage() {
  const { courseId = '', lessonId = '' } = useParams();
  const navigate = useNavigate();
  const createLab = useLabStore((state) => state.createLab);
  const { error: toastError } = useToast();
  const [lesson, setLesson] = useState<AcademyLesson | null>(null);
  const [course, setCourse] = useState<AcademyCourseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkIndex, setCheckIndex] = useState(0);
  const [answerState, setAnswerState] = useState<{ selected: string; correct: boolean; correct_option: string; explanation: string } | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [openingLab, setOpeningLab] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([academyApi.lesson(courseId, lessonId), academyApi.course(courseId)])
      .then(([lessonData, courseData]) => {
        setLesson(lessonData);
        setCourse(courseData);
        const firstUnanswered = lessonData.quick_checks.findIndex((question) => !question.answered_option);
        const resumeIndex = firstUnanswered < 0 ? Math.max(0, lessonData.quick_checks.length - 1) : firstUnanswered;
        setCheckIndex(resumeIndex);
        const previous = lessonData.quick_checks[resumeIndex];
        setAnswerState(previous?.answered_option && previous.correct_option && previous.explanation
          ? { selected: previous.answered_option, correct: Boolean(previous.correct), correct_option: previous.correct_option, explanation: previous.explanation }
          : null);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const currentQuestion = lesson?.quick_checks[checkIndex];
  const currentPosition = useMemo(() => course?.lessons.findIndex((item) => item.slug === lessonId) ?? -1, [course, lessonId]);
  const nextLesson = currentPosition >= 0 ? course?.lessons[currentPosition + 1] : undefined;
  const previousLesson = currentPosition > 0 ? course?.lessons[currentPosition - 1] : undefined;
  const allChecksDone = Boolean(lesson && lesson.quick_checks.length > 0 && checkIndex === lesson.quick_checks.length - 1 && answerState);

  const answer = async (optionId: string) => {
    if (!lesson || !currentQuestion || answerState || submittingAnswer) return;
    setSubmittingAnswer(true);
    try {
      const result = await academyApi.answerQuickCheck(lesson.id, currentQuestion.id, optionId);
      setAnswerState({ selected: optionId, ...result });
    } catch (reason) {
      setError((reason as Error).message);
    } finally { setSubmittingAnswer(false); }
  };

  const continueChecks = () => {
    if (!answerState || !lesson) return;
    if (checkIndex < lesson.quick_checks.length - 1) {
      setCheckIndex((value) => value + 1);
      setAnswerState(null);
    } else {
      document.getElementById('lesson-complete')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const completeLesson = async () => {
    if (!lesson) return;
    setCompleting(true);
    try {
      await academyApi.completeLesson(lesson.id);
      setLesson({ ...lesson, completed: true });
      if (nextLesson) navigate(`/academy/courses/${courseId}/lessons/${nextLesson.slug}`);
      else navigate(`/academy/courses/${courseId}`);
    } catch (reason) { setError((reason as Error).message); }
    finally { setCompleting(false); }
  };

  const openPractice = async () => {
    if (!lesson) return;
    setOpeningLab(true);
    try {
      const lab = await createLab(`Academy practice · ${lesson.title}`, 'A fictional network security learning scenario in the local RedLab simulator.', createExampleNetworkLab());
      navigate(`/lab/${lab.id}`);
    } catch (reason) {
      toastError(`Could not open the practice lab: ${(reason as Error).message}`);
      setOpeningLab(false);
    }
  };

  if (loading) return <PageLoading label="Opening lesson…" />;
  if (error && !lesson) return <ErrorScreen error={error} />;
  if (!lesson || !course) return <ErrorScreen error="This lesson could not be found." />;

  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]"><AcademyHeader active="academy" backLabel={course.title} />
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
      <article className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link to={`/academy/courses/${course.slug}`} className="inline-flex items-center gap-2 text-xs text-[#9BA5B5] transition hover:text-white"><ArrowLeft size={14} /> Course overview</Link><span className="text-[11px] text-[#9BA5B5]">Lesson {lesson.order} of 10 · {lesson.duration_minutes} min</span></div>
        {error && <div className="rounded-xl border border-[#FF3B4E]/40 bg-[#FF3B4E]/10 p-3 text-xs text-[#FFB3BB]">{error}</div>}
        <header><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">Beginner · Lesson {String(lesson.order).padStart(2, '0')}</span><h1 className="mt-2 text-3xl font-bold tracking-tight">{lesson.title}</h1><p className="mt-3 text-sm text-[#9BA5B5]">Build each concept in order, then use the knowledge checks to confirm what you have learned.</p></header>

        <LearningVisual lesson={lesson} />

        <LocalLessonVideo lesson={lesson} />

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2"><TargetIcon /><h2 className="text-sm font-semibold">Learning objectives</h2></div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">{lesson.objectives.map((objective) => <li key={objective} className="flex items-start gap-2 rounded-lg bg-[#0B0D12]/70 p-3 text-xs leading-relaxed text-[#CBD2DC]"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#34D399]" />{objective}</li>)}</ul>
        </Card>

        {lesson.sections.map((section, index) => <section key={section.heading} className="rounded-xl border border-[#293140] bg-[#11151D] p-5 sm:p-6">
          <div className="mb-3 flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF3B4E]/10 text-[11px] font-bold text-[#FF8A4C]">{index + 1}</span><h2 className="pt-1 text-base font-bold">{section.heading}</h2></div>
          {section.body.split('\n\n').map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="mt-3 text-sm leading-7 text-[#B2BBC8]">{paragraph}</p>)}
        </section>)}

        {lesson.lab_kind && <Card className="overflow-hidden border-[#60A5FA]/30">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#60A5FA]/10 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#60A5FA]"><ShieldCheck size={13} /> Practical lab</span><h2 className="mt-2 text-base font-bold">Apply this lesson in RedLab</h2><p className="mt-1 max-w-xl text-xs leading-relaxed text-[#9BA5B5]">Explore a fictional network in the existing local simulator. No real systems are contacted.</p></div>
            <Button variant="secondary" loading={openingLab} icon={<Network size={14} />} onClick={openPractice}>Open safe practice lab</Button>
          </div>
        </Card>}

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5C451]"><CircleHelp size={14} /> Knowledge check</span><h2 className="mt-1 text-base font-bold">Pause and think</h2><p className="mt-1 text-xs text-[#9BA5B5]">These practice questions reinforce the lesson. They do not count toward your final examination score.</p></div>{lesson.quick_checks.length > 0 && <span className="rounded-md bg-[#171C26] px-2 py-1 text-[10px] text-[#9BA5B5]">Question {checkIndex + 1} of {lesson.quick_checks.length}</span>}</div>
          {currentQuestion && <div className="mt-5">
            <p className="text-sm font-medium leading-relaxed">{currentQuestion.question}</p>
            <div className="mt-3 space-y-2">{currentQuestion.options.map((option, index) => {
              const selected = answerState?.selected === option.id;
              const isCorrectAnswer = answerState?.correct_option === option.id;
              const stateClass = answerState ? (isCorrectAnswer ? 'border-[#34D399]/55 bg-[#34D399]/10 text-[#D6F8E8]' : selected ? 'border-[#FF3B4E]/55 bg-[#FF3B4E]/10 text-[#FFD3D7]' : 'border-[#293140] bg-[#0B0D12]/50 text-[#748095]') : 'border-[#293140] bg-[#0B0D12]/50 text-[#CBD2DC] hover:border-[#5A687D] hover:bg-[#171C26]';
              return <button key={option.id} disabled={Boolean(answerState) || submittingAnswer} onClick={() => answer(option.id)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-xs transition ${stateClass}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#171C26] text-[10px] font-bold">{String.fromCharCode(65 + index)}</span><span className="flex-1">{option.text}</span>{answerState && isCorrectAnswer && <CheckCircle2 size={15} className="shrink-0 text-[#34D399]" />}{answerState && selected && !answerState.correct && <AlertTriangle size={15} className="shrink-0 text-[#FF8A4C]" />}</button>;
            })}</div>
            {answerState && <div role="status" className={`mt-4 rounded-lg border p-4 ${answerState.correct ? 'border-[#34D399]/25 bg-[#34D399]/5' : 'border-[#FF8A4C]/25 bg-[#FF8A4C]/5'}`}><p className={`text-xs font-semibold ${answerState.correct ? 'text-[#34D399]' : 'text-[#FFB77D]'}`}>{answerState.correct ? 'That’s right.' : 'Not quite. Review the highlighted answer.'}</p><p className="mt-1.5 text-xs leading-relaxed text-[#B2BBC8]">{answerState.explanation}</p><Button className="mt-3" size="sm" variant="ghost" icon={<ArrowRight size={13} />} onClick={continueChecks}>{checkIndex < lesson.quick_checks.length - 1 ? 'Next question' : 'Continue to lesson completion'}</Button></div>}
          </div>}
        </Card>

        <div id="lesson-complete" className="flex flex-col gap-3 rounded-xl border border-[#293140] bg-[#11151D] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold">{lesson.completed ? 'Lesson completed' : 'Finish this lesson'}</h2><p className="mt-1 text-xs text-[#9BA5B5]">{lesson.completed ? 'Your progress has been saved.' : 'Answer both knowledge checks to record your completion.'}</p></div>
          <div className="flex flex-wrap gap-2">{previousLesson && <Button variant="secondary" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(`/academy/courses/${course.slug}/lessons/${previousLesson.slug}`)}>Previous lesson</Button>}<Button disabled={!allChecksDone && !lesson.completed} loading={completing} variant="primary" size="sm" icon={<CheckCircle2 size={14} />} onClick={completeLesson}>{nextLesson ? 'Complete & continue' : 'Complete course lessons'}</Button></div>
        </div>
      </article>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9BA5B5]">In this course</p><div className="mt-3 space-y-1">{course.lessons.map((item) => <button key={item.id} onClick={() => navigate(`/academy/courses/${course.slug}/lessons/${item.slug}`)} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] transition ${item.slug === lesson.slug ? 'bg-[#FF3B4E]/10 text-[#F3F5F8]' : 'text-[#9BA5B5] hover:bg-[#171C26] hover:text-white'}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold ${item.completed ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-[#171C26] text-[#748095]'}`}>{item.completed ? <CheckCircle2 size={12} /> : item.order}</span><span className="line-clamp-2">{item.title}</span></button>)}</div></Card>
        <Card className="p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9BA5B5]">Remember</p><p className="mt-2 text-xs leading-relaxed text-[#B2BBC8]">Practice only in systems where you have explicit authorization. Academy labs use fictional data in RedLab’s local simulation.</p></Card>
      </aside>
    </main>
  </div>;
}

function TargetIcon() { return <Shield size={16} className="text-[#60A5FA]" />; }

function LearningVisual({ lesson }: { lesson: AcademyLesson }) {
  const slug = lesson.slug;
  if (slug === 'phishing-social-engineering') return <Card className="overflow-hidden border-[#FF8A4C]/20"><div className="border-b border-[#293140] bg-[#171C26] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#9BA5B5]">Message inspection · fictional example</div><div className="grid gap-4 p-4 sm:grid-cols-[1fr_180px] sm:p-5"><div className="rounded-lg border border-[#293140] bg-[#0B0D12] p-4"><div className="flex items-center gap-2 text-xs"><Mail size={15} className="text-[#FF8A4C]" /><strong>Action required today</strong></div><p className="mt-3 text-[11px] text-[#9BA5B5]">From: <span className="text-[#FFB77D]">payroll-alerts@example.invalid</span></p><p className="mt-3 text-xs leading-relaxed text-[#B2BBC8]">Your account will be closed. Confirm your password and payment details using the link below.</p><div className="mt-3 inline-block rounded bg-[#FF3B4E]/10 px-3 py-2 text-[10px] text-[#FF8A4C]">Verify account →</div></div><div className="flex flex-col justify-center gap-2">{['Unexpected sender', 'Urgent pressure', 'Sensitive request'].map((signal) => <div key={signal} className="flex items-center gap-2 rounded-lg border border-[#FF8A4C]/15 bg-[#FF8A4C]/5 px-3 py-2 text-[10px] text-[#FFB77D]"><AlertTriangle size={12} />{signal}</div>)}</div></div></Card>;
  if (slug === 'networking-fundamentals' || slug === 'basic-network-security') return <Card className="p-5"><div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">{[{ icon: <Globe2 size={18} />, name: 'Client', color: '#60A5FA' }, { icon: <Network size={18} />, name: 'Network boundary', color: '#F5C451' }, { icon: <LockKeyhole size={18} />, name: 'Firewall', color: '#FF8A4C' }, { icon: <Cloud size={18} />, name: 'Service', color: '#34D399' }].map((step, index) => <div key={step.name} className="flex items-center gap-3"><div className="flex flex-col items-center gap-2"><span className="flex h-12 w-12 items-center justify-center rounded-xl border" style={{ borderColor: `${step.color}50`, color: step.color, backgroundColor: `${step.color}10` }}>{step.icon}</span><span className="text-[10px] text-[#B2BBC8]">{step.name}</span></div>{index < 3 && <ArrowRight size={15} className="mb-5 text-[#596477]" />}</div>)}</div><p className="mt-4 text-center text-[10px] text-[#748095]">Traffic should cross each boundary only when the service and source are expected.</p></Card>;
  if (slug === 'passwords-and-authentication') return <Card className="p-5"><div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row"><VisualStep icon={<Fingerprint size={19} />} title="Prove identity" detail="Password or passkey" color="#60A5FA" /><ArrowRight size={17} className="rotate-90 text-[#596477] sm:rotate-0" /><VisualStep icon={<LockKeyhole size={19} />} title="Add a factor" detail="Security key / device" color="#F5C451" /><ArrowRight size={17} className="rotate-90 text-[#596477] sm:rotate-0" /><VisualStep icon={<ShieldCheck size={19} />} title="Check permissions" detail="Least required access" color="#34D399" /></div></Card>;
  if (slug === 'cloud-security-and-incident-response') return <Card className="p-5"><div className="grid gap-2 sm:grid-cols-4">{[{ icon: <Eye size={17} />, title: 'Notice', text: 'Report the signal', color: '#60A5FA' }, { icon: <Shield size={17} />, title: 'Contain', text: 'Limit ongoing impact', color: '#F5C451' }, { icon: <Workflow size={17} />, title: 'Investigate', text: 'Use preserved evidence', color: '#FF8A4C' }, { icon: <CheckCircle2 size={17} />, title: 'Recover', text: 'Restore and learn', color: '#34D399' }].map((step) => <div key={step.title} className="rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-3"><span style={{ color: step.color }}>{step.icon}</span><p className="mt-2 text-xs font-semibold">{step.title}</p><p className="mt-1 text-[10px] text-[#9BA5B5]">{step.text}</p></div>)}</div></Card>;
  if (slug === 'malware-basics') return <Card className="p-5"><div className="flex flex-wrap items-center justify-center gap-3"><VisualStep icon={<AlertTriangle size={18} />} title="Suspect" detail="Unexpected behavior" color="#FF8A4C" /><ArrowRight size={15} className="text-[#596477]" /><VisualStep icon={<Shield size={18} />} title="Report" detail="Use response process" color="#F5C451" /><ArrowRight size={15} className="text-[#596477]" /><VisualStep icon={<Database size={18} />} title="Recover" detail="Tested clean backup" color="#34D399" /></div></Card>;
  return <Card className="p-5"><div className="grid gap-3 sm:grid-cols-3">{[{ icon: <ShieldCheck size={18} />, title: 'Prevent', description: 'Reduce exposure before an event.', color: '#60A5FA' }, { icon: <Eye size={18} />, title: 'Detect', description: 'Notice and investigate unusual signals.', color: '#F5C451' }, { icon: <Workflow size={18} />, title: 'Recover', description: 'Restore service and improve controls.', color: '#34D399' }].map((item) => <div key={item.title} className="rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-4"><span style={{ color: item.color }}>{item.icon}</span><h3 className="mt-2 text-xs font-semibold">{item.title}</h3><p className="mt-1 text-[10px] leading-relaxed text-[#9BA5B5]">{item.description}</p></div>)}</div></Card>;
}

function VisualStep({ icon, title, detail, color }: { icon: ReactNode; title: string; detail: string; color: string }) {
  return <div className="flex min-w-[145px] flex-col items-center rounded-xl border border-[#293140] bg-[#0B0D12]/60 p-4 text-center"><span style={{ color }}>{icon}</span><span className="mt-2 text-xs font-semibold">{title}</span><span className="mt-1 text-[10px] text-[#9BA5B5]">{detail}</span></div>;
}

function ErrorScreen({ error }: { error: string }) {
  return <div className="grid min-h-screen place-items-center bg-[#0B0D12] px-5 text-center text-white"><div><p className="text-base font-semibold">Lesson unavailable</p><p className="mt-2 text-sm text-[#9BA5B5]">{error}</p><Link className="mt-4 inline-block text-xs text-[#FF8A4C]" to="/academy">Return to Academy</Link></div></div>;
}

export default AcademyLessonPage;
