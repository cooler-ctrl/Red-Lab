import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Clock3, Loader2, RotateCcw, ShieldCheck, Target, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { academyApi, type AcademyQuestion, type ExamAttempt, type ExamResult } from './academyTypes';
import { AcademyHeader, Card, PageLoading } from './AcademyShared';

export function AcademyStartExamPage() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    academyApi.startExam(courseId).then((attempt) => navigate(`/academy/exams/${attempt.id}`, { replace: true })).catch((reason: Error) => setError(reason.message));
  }, [courseId, navigate]);
  return error ? <ExamError error={error} /> : <PageLoading label="Preparing your 20-question examination…" />;
}

export function AcademyExamPage() {
  const { attemptId = '' } = useParams();
  const [exam, setExam] = useState<ExamAttempt | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);

  useEffect(() => {
    academyApi.exam(attemptId).then((response) => {
      if ('review' in response) { setResult(response); submittedRef.current = true; }
      else { setExam(response); setAnswers(response.answers ?? {}); answersRef.current = response.answers ?? {}; setSecondsLeft(Math.max(0, Math.floor((new Date(response.expires_at).getTime() - Date.now()) / 1000))); }
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [attemptId]);

  const submit = useCallback(async () => {
    if (submittedRef.current || !exam) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const response = await academyApi.submitExam(attemptId, answersRef.current);
      setResult(response);
      setExam(null);
    } catch (reason) {
      submittedRef.current = false;
      setError((reason as Error).message);
    } finally { setSubmitting(false); }
  }, [attemptId, exam]);

  useEffect(() => {
    if (!exam || result) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(exam.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) void submit();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [exam, result, submit]);

  const choose = async (question: AcademyQuestion, optionId: string) => {
    const next = { ...answersRef.current, [question.id]: optionId };
    answersRef.current = next;
    setAnswers(next);
    setSaving(true);
    try { await academyApi.saveAnswers(attemptId, next); }
    catch (reason) { setError((reason as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoading label="Loading examination…" />;
  if (error && !exam && !result) return <ExamError error={error} />;
  if (result) return <ExamResults result={result} />;
  if (!exam) return <ExamError error={error || 'This examination is not available.'} />;

  const question = exam.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]"><AcademyHeader active="academy" backLabel="Final examination" />
    <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link to={`/academy/courses/${exam.course_id}`} className="inline-flex items-center gap-2 text-xs text-[#9BA5B5] hover:text-white"><ArrowLeft size={14} /> Course</Link><span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm ${secondsLeft < 300 ? 'border-[#FF3B4E]/40 bg-[#FF3B4E]/10 text-[#FF8A4C]' : 'border-[#293140] bg-[#11151D] text-[#F3F5F8]'}`}><Clock3 size={15} /> {minutes}:{seconds}</span></div>
      <div className="mt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF8A4C]">Beginner · Final examination</span><h1 className="mt-1 text-2xl font-bold">Cybersecurity Foundations</h1></div><span className="text-xs text-[#9BA5B5]">{answeredCount} / 20 answered</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#171C26]"><div className="h-full rounded-full bg-[#FF3B4E] transition-all" style={{ width: `${((currentIndex + 1) / exam.question_count) * 100}%` }} /></div></div>
      {error && <div className="mt-4 rounded-xl border border-[#FF3B4E]/35 bg-[#FF3B4E]/10 p-3 text-xs text-[#FFB3BB]">{error}</div>}
      {question && <Card className="mt-5 p-5 sm:p-8">
        <div className="flex items-center justify-between"><span className="rounded-md bg-[#171C26] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9BA5B5]">Question {currentIndex + 1} of 20</span><span className="text-[10px] text-[#748095]">{question.topic}</span></div>
        <h2 className="mt-6 text-lg font-semibold leading-relaxed sm:text-xl">{question.question}</h2>
        <div className="mt-6 space-y-3">{question.options.map((option, index) => <button key={option.id} disabled={saving || submitting} onClick={() => choose(question, option.id)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm transition ${answers[question.id] === option.id ? 'border-[#FF3B4E]/60 bg-[#FF3B4E]/10 text-white' : 'border-[#293140] bg-[#0B0D12]/60 text-[#CBD2DC] hover:border-[#596477] hover:bg-[#171C26]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${answers[question.id] === option.id ? 'bg-[#FF3B4E] text-white' : 'bg-[#171C26] text-[#9BA5B5]'}`}>{String.fromCharCode(65 + index)}</span><span className="flex-1">{option.text}</span>{answers[question.id] === option.id && <CheckCircle2 size={16} className="text-[#FF8A4C]" />}</button>)}</div>
        <p className="mt-4 flex items-center gap-1.5 text-[10px] text-[#748095]">{saving ? <><Loader2 size={11} className="animate-spin" /> Saving your answer…</> : 'Your answers are saved as you go. You may return to earlier questions.'}</p>
      </Card>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" disabled={currentIndex === 0} icon={<ArrowLeft size={14} />} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}>Previous</Button><div className="flex flex-wrap gap-2">{currentIndex < exam.questions.length - 1 ? <Button variant="secondary" icon={<ArrowRight size={14} />} onClick={() => setCurrentIndex((value) => Math.min(exam.questions.length - 1, value + 1))}>Next question</Button> : <Button variant="primary" loading={submitting} disabled={saving} icon={<CheckCircle2 size={14} />} onClick={() => void submit()}>Submit examination</Button>}</div></div>
      <div className="mt-5 grid grid-cols-10 gap-1.5">{exam.questions.map((item, index) => <button key={item.id} aria-label={`Go to question ${index + 1}`} onClick={() => setCurrentIndex(index)} className={`h-2.5 rounded-sm transition ${index === currentIndex ? 'bg-[#FF8A4C]' : answers[item.id] ? 'bg-[#34D399]' : 'bg-[#293140] hover:bg-[#596477]'}`} />)}</div>
      <p className="mt-5 text-center text-[10px] text-[#748095]">Passing score: 50% (10 of 20 correct). Practice checks do not affect this result.</p>
    </main>
  </div>;
}

function ExamResults({ result }: { result: ExamResult }) {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]"><AcademyHeader active="academy" backLabel="Examination results" />
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden"><div className={`p-6 sm:p-8 ${result.passed ? 'bg-gradient-to-r from-[#34D399]/10 to-transparent' : 'bg-gradient-to-r from-[#FF8A4C]/10 to-transparent'}`}><span className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${result.passed ? 'text-[#34D399]' : 'text-[#FFB77D]'}`}>{result.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{result.passed ? 'Course examination passed' : result.expired ? 'Time expired' : 'Another attempt needed'}</span><div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2"><strong className="text-5xl font-bold">{result.score}%</strong><span className="pb-1 text-sm text-[#9BA5B5]">{result.correct_count} of {result.question_count} correct · pass mark {result.pass_score}%</span></div><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9BA5B5]">{result.passed ? 'Your course is complete. Your RED-Lab Academy certificate is ready on your dashboard.' : 'Review the topics below, revisit the recommended lessons, then try the examination again.'}</p><div className="mt-5 flex flex-wrap gap-2">{result.passed ? <Button variant="primary" icon={<Award size={15} />} onClick={() => navigate('/academy')}>View your certificate</Button> : <Button variant="primary" icon={<RotateCcw size={15} />} onClick={() => navigate(`/academy/courses/${result.course_id}/exam`)}>Retake examination</Button>}<Button variant="secondary" onClick={() => navigate(`/academy/courses/${result.course_id}`)}>Review course lessons</Button></div></div></Card>
      {!result.passed && <Card className="p-5"><h2 className="text-base font-bold">Topics to revisit</h2>{result.topics_to_review.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{result.topics_to_review.map((topic) => { const lesson = result.review.find((item) => item.topic === topic.topic)?.lesson; return <button key={topic.topic} onClick={() => lesson && navigate(`/academy/courses/${result.course_id}/lessons/${lesson}`)} className="flex items-center gap-3 rounded-lg border border-[#293140] bg-[#0B0D12]/60 p-3 text-left hover:border-[#FF8A4C]/40"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8A4C]/10 text-[#FFB77D]"><Target size={15} /></span><span className="min-w-0 flex-1"><strong className="block text-xs">{topic.topic}</strong><span className="mt-0.5 block text-[10px] text-[#9BA5B5]">{topic.correct} of {topic.total} correct · revisit lesson</span></span><ArrowRight size={14} className="text-[#748095]" /></button>; })}</div> : <p className="mt-2 text-xs text-[#9BA5B5]">Revisit the lessons and try again when ready.</p>}</Card>}
      <Card className="p-5"><h2 className="text-base font-bold">Answer review</h2><div className="mt-4 space-y-2">{result.review.map((item, index) => <details key={item.question_id} className="group rounded-lg border border-[#293140] bg-[#0B0D12]/50 p-3"><summary className="flex cursor-pointer list-none items-start gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.correct ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#FF3B4E]/10 text-[#FF8A4C]'}`}>{item.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}</span><span className="flex-1 text-xs leading-relaxed"><span className="mr-1 text-[#748095]">{index + 1}.</span>{item.question}</span><span className="text-[10px] text-[#748095]">{item.topic}</span></summary><div className="ml-9 mt-3 border-t border-[#293140] pt-3 text-xs"><p className="text-[#9BA5B5]">Your answer: <span className={item.correct ? 'text-[#34D399]' : 'text-[#FF8A4C]'}>{item.selected_text ?? 'Not answered'}</span></p>{!item.correct && <p className="mt-1 text-[#9BA5B5]">Correct answer: <span className="text-[#34D399]">{item.correct_text}</span></p>}<p className="mt-2 leading-relaxed text-[#B2BBC8]">{item.explanation}</p></div></details>)}</div></Card>
    </main>
  </div>;
}

function ExamError({ error }: { error: string }) {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8]"><AcademyHeader active="academy" backLabel="Examination" /><main className="mx-auto max-w-2xl px-4 py-20 text-center"><XCircle size={35} className="mx-auto text-[#FF8A4C]" /><h1 className="mt-4 text-xl font-bold">Examination unavailable</h1><p className="mt-2 text-sm text-[#9BA5B5]">{error}</p><Button className="mt-5" onClick={() => navigate('/academy')}>Return to Academy</Button></main></div>;
}

export default AcademyExamPage;
