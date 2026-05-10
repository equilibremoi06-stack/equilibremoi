import { jsPDF } from 'jspdf';
import type { ProgressSummary, WeightEntry } from '../data/progressTracking';
import { getMotivationalQuoteForPdf } from './premiumLivingContent';

const COL = {
  rose: [242, 167, 176] as [number, number, number],
  or: [200, 164, 74] as [number, number, number],
  ink: [26, 46, 34] as [number, number, number],
  cream: [255, 252, 248] as [number, number, number],
  blush: [253, 238, 242] as [number, number, number],
};

function magazineCover(doc: jsPDF, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COL.blush);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(...COL.rose);
  doc.rect(0, 0, w, 48, 'F');
  doc.setFillColor(...COL.or);
  doc.rect(w - 42, 0, 42, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('EquilibreMoi', w / 2, 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Magazine · bien-être féminin', w / 2, 38, { align: 'center' });
  doc.setTextColor(...COL.ink);
  doc.setFontSize(13);
  doc.text(subtitle, w / 2, 62, { align: 'center' });
  doc.setDrawColor(...COL.or);
  doc.setLineWidth(0.4);
  doc.line(24, 72, w - 24, 72);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' }),
    w / 2,
    h - 14,
    { align: 'center' },
  );
}

function softQuotePage(doc: jsPDF, quote: string) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COL.cream);
  doc.rect(0, 0, w, h, 'F');
  doc.setTextColor(...COL.ink);
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  const lines = doc.splitTextToSize(`« ${quote} »`, w - 36);
  doc.text(lines, w / 2, h / 2 - (lines.length * 5) / 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COL.or);
  doc.text('— Ton espace EquilibreMoi', w / 2, h / 2 + (lines.length * 5) / 2 + 12, { align: 'center' });
}

function emotionalClosing(doc: jsPDF, lines: string[]) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COL.blush);
  doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), 'F');
  doc.setTextColor(...COL.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Résumé émotionnel', 20, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 40;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, w - 40);
    doc.text(wrapped, 20, y);
    y += wrapped.length * 5 + 6;
  }
}

export function downloadCoursesMagazinePdf(params: {
  daysCount: number;
  categories: ReadonlyArray<readonly [string, ReadonlyArray<{ name: string; quantityLabel: string }>]>;
  userId?: string | null;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  magazineCover(doc, `Liste de courses · ${params.daysCount} jour${params.daysCount > 1 ? 's' : ''}`);

  doc.setTextColor(...COL.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 82;
  doc.setFont('helvetica', 'bold');
  doc.text('Ta semaine en bref', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  const intro = doc.splitTextToSize(
    'Voici ta liste organisée par rayon, pensée pour alléger ton esprit et ton panier. Chaque catégorie regroupe ce dont tu as besoin pour rester alignée avec ton programme.',
    doc.internal.pageSize.getWidth() - 40,
  );
  doc.text(intro, 20, y);
  y += intro.length * 5 + 10;

  for (const [category, items] of params.categories) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(...COL.rose);
    doc.roundedRect(16, y - 4, doc.internal.pageSize.getWidth() - 32, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(category, 20, y + 2);
    doc.setTextColor(...COL.ink);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += 12;
    const lineText = items.map((it) => `${it.name} — ${it.quantityLabel}`).join(' · ');
    const wrapped = doc.splitTextToSize(lineText, doc.internal.pageSize.getWidth() - 40);
    doc.text(wrapped, 20, y);
    y += wrapped.length * 4.5 + 10;
  }

  softQuotePage(doc, getMotivationalQuoteForPdf(new Date(), params.userId));

  emotionalClosing(doc, [
    'Ce document est une invitation à te féliciter pour les petits efforts du quotidien.',
    'L’équilibre n’est pas une ligne droite : c’est une suite de choix doux qui te ressemblent.',
    'Prends ce PDF comme un rappel : tu mérites une alimentation qui te soutient, sans rigidité.',
  ]);

  doc.save(`equilibremoi-courses-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadMonthlyBilanMagazinePdf(params: {
  summary: ProgressSummary;
  entries: WeightEntry[];
  userId?: string | null;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  magazineCover(doc, 'Bilan mensuel · progression douce');

  doc.setTextColor(...COL.ink);
  let y = 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Progression du mois', 20, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const stats = [
    `Poids de départ (période) : ${params.summary.startWeight} kg`,
    `Poids actuel : ${params.summary.currentWeight} kg`,
    `Évolution : ${params.summary.deltaKg >= 0 ? '+' : ''}${params.summary.deltaKg.toFixed(1)} kg`,
  ];
  for (const s of stats) {
    doc.text(s, 20, y);
    y += 7;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Relevés enregistrés', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const e of [...params.entries].sort((a, b) => a.date.localeCompare(b.date))) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${e.date} — ${e.weightKg} kg${e.waistCm != null ? ` · taille ${e.waistCm} cm` : ''}`, 20, y);
    y += 5;
  }

  softQuotePage(doc, getMotivationalQuoteForPdf(new Date(), params.userId));

  // Mini "graph" textuel
  doc.addPage();
  doc.setFillColor(...COL.cream);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  doc.setTextColor(...COL.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Courbe douce (aperçu)', 20, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const sorted = [...params.entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length >= 2) {
    const first = sorted[0].weightKg;
    const last = sorted[sorted.length - 1].weightKg;
    const trend = last - first;
    const msg =
      trend <= -0.1
        ? 'Tendance observée : douce baisse sur la période — un rythme compatible avec la durabilité.'
        : trend >= 0.1
          ? 'Tendance observée : légère hausse — sans jugement : les corps vivent des phases.'
          : 'Tendance observée : stabilité — parfois la "pause" est déjà une victoire.';
    const w = doc.splitTextToSize(msg, doc.internal.pageSize.getWidth() - 40);
    doc.text(w, 20, 40);
  }

  emotionalClosing(doc, [
    'Ce bilan est le reflet d’un chemin personnel, pas d’une performance à noter.',
    'Les corrélations IA de ton espace t’aideront bientôt à relier humeur, sommeil et repas — toujours avec douceur.',
  ]);

  doc.save(`equilibremoi-bilan-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadMenusWeekMagazinePdf(params: {
  weekLabel: string;
  days: Array<{ label: string; breakfast: string; lunch: string; dinner: string }>;
  userId?: string | null;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  magazineCover(doc, `Menus · ${params.weekLabel}`);

  doc.setTextColor(...COL.ink);
  let y = 82;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const d of params.days) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(d.label, 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const rows = [
      `Matin : ${d.breakfast}`,
      `Midi : ${d.lunch}`,
      `Soir : ${d.dinner}`,
    ];
    for (const r of rows) {
      const w = doc.splitTextToSize(r, doc.internal.pageSize.getWidth() - 40);
      doc.text(w, 22, y);
      y += w.length * 4.5 + 2;
    }
    y += 8;
  }

  softQuotePage(doc, getMotivationalQuoteForPdf(new Date(), params.userId));

  doc.save(`equilibremoi-menus-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadEvolutionReportMagazinePdf(params: {
  summary: ProgressSummary;
  entries: WeightEntry[];
  userId?: string | null;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  magazineCover(doc, 'Rapport · ton évolution');

  doc.setTextColor(...COL.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 82;
  const intro = doc.splitTextToSize(
    'Ce rapport rassemble ton parcours récent : pas pour te juger, mais pour te montrer où tu en es avec bienveillance.',
    doc.internal.pageSize.getWidth() - 40,
  );
  doc.text(intro, 20, y);
  y += intro.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Synthèse', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Évolution constatée : ${params.summary.deltaKg >= 0 ? '+' : ''}${params.summary.deltaKg.toFixed(1)} kg`, 20, y);
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Repères', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const e of [...params.entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-8)) {
    doc.text(`${e.date} → ${e.weightKg} kg`, 20, y);
    y += 5;
  }

  softQuotePage(doc, getMotivationalQuoteForPdf(new Date(), params.userId ?? undefined));

  emotionalClosing(doc, [
    'Ton évolution mérite d’être lue comme une histoire, pas comme un score.',
    'Le Premium continue d’affiner ce regard, semaine après semaine.',
  ]);

  doc.save(`equilibremoi-evolution-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadMenopauseGynecoMagazinePdf(params?: { userId?: string | null }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  magazineCover(doc, 'Carnet ménopause · partage avec ton équipe soignante');

  doc.setTextColor(...COL.ink);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 82;
  const blocks = [
    'Utilise ces pages pour noter symptômes, sommeil, humeur et ressentis — à partager si tu le souhaites avec un·e professionnel·le de santé.',
    'À compléter : bouffées de chaleur, qualité du sommeil, fatigue perçue, irritabilité, cycles si pertinents.',
    'Rappel : ce document ne remplace pas un avis médical.',
  ];
  for (const b of blocks) {
    const w = doc.splitTextToSize(b, doc.internal.pageSize.getWidth() - 40);
    doc.text(w, 20, y);
    y += w.length * 5 + 8;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Notes (grille libre)', 20, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (let i = 0; i < 14; i += 1) {
    doc.line(20, y, doc.internal.pageSize.getWidth() - 20, y);
    y += 8;
  }

  softQuotePage(doc, getMotivationalQuoteForPdf(new Date(), params?.userId));

  doc.save(`equilibremoi-menopause-gyneco-${new Date().toISOString().slice(0, 10)}.pdf`);
}
