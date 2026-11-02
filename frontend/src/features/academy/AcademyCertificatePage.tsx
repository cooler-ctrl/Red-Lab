import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, ArrowLeft, Download, Flame, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/Button';
import { academyApi } from './academyTypes';
import { AcademyHeader, PageLoading, formatDate } from './AcademyShared';

export function AcademyCertificatePage() {
  const { certificateId = '' } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Awaited<ReturnType<typeof academyApi.certificate>> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { academyApi.certificate(certificateId).then(setCertificate).catch((reason: Error) => setError(reason.message)); }, [certificateId]);
  if (!certificate && !error) return <PageLoading label="Preparing your certificate…" />;
  if (error || !certificate) return <div className="min-h-screen bg-[#0B0D12] text-white"><AcademyHeader active="academy" /><main className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-sm text-[#FFB77D]">{error || 'Certificate not found'}</p><Button className="mt-4" onClick={() => navigate('/academy')}>Return to Academy</Button></main></div>;

  return <div className="min-h-screen bg-[#0B0D12] text-[#F3F5F8] print:min-h-0 print:bg-white print:text-[#151515]">
    <div className="no-print"><AcademyHeader active="academy" backLabel="Certificate" /><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8"><button onClick={() => navigate('/academy')} className="inline-flex items-center gap-2 text-xs text-[#9BA5B5] hover:text-white"><ArrowLeft size={14} /> Academy dashboard</button><Button variant="primary" icon={<Download size={15} />} onClick={() => window.print()}>Print / save as PDF</Button></div></div>
    <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8 print:max-w-none print:p-0">
      <section className="academy-certificate relative overflow-hidden border border-[#7E3A42] bg-[#11151D] px-6 py-10 text-center shadow-2xl shadow-black/30 sm:px-16 sm:py-16 print:border-4 print:border-[#A9323F] print:bg-white print:text-[#151515] print:shadow-none">
        <div className="absolute inset-3 border border-[#7E3A42]/50 print:inset-4 print:border-[#D8AF62]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF3B4E]/15 text-[#FF8A4C] print:bg-[#A9323F]/10 print:text-[#A9323F]"><Flame size={27} /></div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FF8A4C] print:text-[#A9323F]">RED-Lab Academy</p>
          <h1 className="mt-6 text-3xl font-semibold tracking-wide sm:text-5xl">Certificate of Completion</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#9BA5B5] print:text-[#555]">This certificate is awarded to</p>
          <p className="mt-3 border-b border-[#D8AF62] pb-3 text-2xl font-semibold text-white sm:text-3xl print:text-[#1A1A1A]">{certificate.student_name}</p>
          <p className="mt-6 text-sm leading-relaxed text-[#9BA5B5] print:text-[#555]">for successfully completing the {certificate.level_name} course</p>
          <h2 className="mt-3 text-xl font-bold text-[#F3F5F8] sm:text-2xl print:text-[#A9323F]">{certificate.course_title}</h2>
          <div className="mx-auto mt-8 grid max-w-lg gap-4 border-y border-[#293140] py-5 sm:grid-cols-3 print:border-[#DDD]">
            <CertificateValue label="Final score" value={`${certificate.score}%`} />
            <CertificateValue label="Completion date" value={formatDate(certificate.issued_at)} />
            <CertificateValue label="Certificate ID" value={certificate.certificate_id} />
          </div>
          <div className="mt-9 flex flex-col items-center justify-center gap-2"><span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8AF62]/60 text-[#D8AF62] print:border-[#A9323F] print:text-[#A9323F]"><Award size={21} /></span><span className="text-[10px] uppercase tracking-[0.18em] text-[#9BA5B5] print:text-[#666]">Learning · Practice · Defense</span></div>
          <p className="mt-8 inline-flex items-center gap-1.5 text-[10px] text-[#748095] print:text-[#777]"><ShieldCheck size={12} /> RED-Lab Academy · Local learning record</p>
        </div>
      </section>
      <p className="no-print mx-auto mt-4 max-w-3xl text-center text-[11px] leading-relaxed text-[#748095]">Use “Print / save as PDF” and choose “Save as PDF” in the print dialog to download a copy.</p>
    </main>
  </div>;
}

function CertificateValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#748095] print:text-[#666]">{label}</p><p className="mt-1 text-xs font-semibold text-[#F3F5F8] print:text-[#222]">{value}</p></div>;
}

export default AcademyCertificatePage;
