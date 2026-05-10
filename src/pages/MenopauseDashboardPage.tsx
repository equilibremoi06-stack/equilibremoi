/**
 * Parcours ménopause : écran volontairement minimal tant que le programme classique
 * est stabilisé (accès, PDF, structure). Pas de moteur métier lourd ici pour l’instant.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAccess } from '../context/UserAccessContext';
import { hasPremiumEntitlements } from '../lib/authFlow';
import { downloadMenopauseGynecoMagazinePdf } from '../lib/premiumMagazinePdf';
import styles from './QuestionnaireMenopausePage.module.css';

type MenopauseTab = 'accueil' | 'programme' | 'recettes' | 'suivi' | 'premium';

const BASE_TABS: { id: MenopauseTab; label: string; labelPremium?: string }[] = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'programme', label: 'Programme ménopause' },
  { id: 'recettes', label: 'Recettes douces' },
  { id: 'suivi', label: 'Suivi symptômes' },
  { id: 'premium', label: '✨ Premium', labelPremium: 'Premium actif ✨' },
];

type Props = {
  initialTab?: string;
};

export default function MenopauseDashboardPage({ initialTab }: Props) {
  const navigate = useNavigate();
  const { access, profile, user } = useUserAccess();
  const hasPremiumAccess = hasPremiumEntitlements(access, profile);

  const tabs = useMemo(
    () =>
      BASE_TABS.map((t) =>
        t.id === 'premium' && hasPremiumAccess && t.labelPremium ? { ...t, label: t.labelPremium } : t,
      ),
    [hasPremiumAccess],
  );

  const initial = useMemo<MenopauseTab>(
    () => (BASE_TABS.some((tab) => tab.id === initialTab) ? (initialTab as MenopauseTab) : 'accueil'),
    [initialTab],
  );
  const [activeTab, setActiveTab] = useState<MenopauseTab>(initial);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.inner} ${styles.dashboardInner}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>Dashboard ménopause</p>
          <h1 className={styles.title}>Ton espace douceur est prêt 🌸</h1>
          <p className={styles.lead}>
            Un tableau de bord pensé pour suivre ton énergie, tes symptômes et ton équilibre
            alimentaire avec calme, sans pression et sans promesse médicale.
          </p>
        </header>

        <nav className={styles.dashboardTabs} aria-label="Navigation ménopause">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.dashboardTab} ${activeTab === tab.id ? styles.dashboardTabActive : ''} ${
                hasPremiumAccess && tab.id === 'premium' && activeTab === tab.id
                  ? styles.dashboardTabPremiumGlow
                  : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'accueil' ? (
          <section className={styles.dashboardPanel}>
            <h2 className={styles.panelTitle}>Aujourd’hui, on avance en douceur</h2>
            <div className={styles.dashboardGrid}>
              <article className={styles.miniCard}>
                <h3 className={styles.miniTitle}>Énergie</h3>
                <p className={styles.miniLine}>Observe ton niveau du jour, sans jugement.</p>
              </article>
              <article className={styles.miniCard}>
                <h3 className={styles.miniTitle}>Sommeil</h3>
                <p className={styles.miniLine}>Des repères simples pour alléger les soirées.</p>
              </article>
              <article className={styles.miniCard}>
                <h3 className={styles.miniTitle}>Bouffées de chaleur</h3>
                <p className={styles.miniLine}>Hydratation, régularité, aliments apaisants.</p>
              </article>
              <article className={styles.miniCard}>
                <h3 className={styles.miniTitle}>Humeur</h3>
                <p className={styles.miniLine}>Un cadre stable pour soutenir les journées sensibles.</p>
              </article>
            </div>
          </section>
        ) : null}

        {activeTab === 'programme' ? (
          <section className={styles.dashboardPanel}>
            <h2 className={styles.panelTitle}>Programme ménopause</h2>
            <ul className={styles.detailList}>
              <li>Repas structurés pour soutenir l’énergie.</li>
              <li>Collations douces si la fatigue ou les envies augmentent.</li>
              <li>Conseils généraux, toujours dans un cadre bien-être non médical.</li>
            </ul>
          </section>
        ) : null}

        {activeTab === 'recettes' ? (
          <section className={styles.dashboardPanel}>
            <h2 className={styles.panelTitle}>Recettes douces</h2>
            <p className={styles.lead}>
              Des idées simples, rassasiantes et chaleureuses, avec des touches calcium,
              fibres, protéines et confort digestif.
            </p>
          </section>
        ) : null}

        {activeTab === 'suivi' ? (
          <section className={styles.dashboardPanel}>
            <h2 className={styles.panelTitle}>Suivi symptômes</h2>
            <ul className={styles.detailList}>
              <li>Énergie, sommeil, humeur et bouffées de chaleur.</li>
              <li>Repères d’évolution pour mieux comprendre ton rythme.</li>
              <li>Rappel : en cas de symptôme inhabituel, consulte un professionnel de santé.</li>
            </ul>
          </section>
        ) : null}

        {activeTab === 'premium' ? (
          <section className={`${styles.dashboardPanel} ${hasPremiumAccess ? styles.dashboardPanelPremium : ''}`}>
            <h2 className={styles.panelTitle}>
              {hasPremiumAccess ? 'Premium ménopause · actif ✨' : '✨ Premium ménopause'}
            </h2>
            <p className={styles.lead} style={{ marginTop: '0.35rem', maxWidth: '40rem' }}>
              Ce parcours reste <strong>séparé</strong> du programme classique. Pour l’instant, l’essentiel : un espace
              dédié, des repères doux et, en Premium, un PDF soigné pour ton suivi — sans promesse médicale.
            </p>
            <ul className={styles.detailList}>
              <li>Introduction et repères nutritionnels généraux (bien-être, non clinique).</li>
              <li>Avec Premium : export « carnet gynéco » magazine, prêt à compléter ou à partager si tu le souhaites.</li>
              <li>
                Le suivi symptomatique avancé et les menus spécialisés arriveront ensuite, une fois le parcours classique
                bien stabilisé.
              </li>
              {!hasPremiumAccess ? (
                <li>Passe par les offres pour activer Premium — même logique d’accès que sur EquilibreMoi.</li>
              ) : null}
            </ul>

            {hasPremiumAccess ? (
              <div className={styles.menopausePremiumActions}>
                <p className={styles.menopausePremiumHint}>
                  Télécharge un carnet prêt à imprimer : grille de notes, citation du jour, pages à partager avec ton
                  équipe soignante si tu le souhaites.
                </p>
                <div className={styles.menopausePremiumBtnRow}>
                  <button
                    type="button"
                    className={styles.menopausePdfMagazineBtn}
                    onClick={() => downloadMenopauseGynecoMagazinePdf({ userId: user?.id ?? null })}
                  >
                    PDF magazine · carnet gynéco
                  </button>
                  <button type="button" className={styles.menopauseSecondaryBtn} onClick={() => navigate('/premium')}>
                    Espace Premium luxe
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.menopauseSoftUpsell}>
                <p className={styles.menopauseSoftUpsellText}>
                  Tu progresses bien ✨ En Premium, tu débloques entre autres le carnet PDF pour ton suivi — et les
                  futures fonctions profondes du parcours ménopause, quand elles seront prêtes.
                </p>
                <div className={styles.menopausePremiumBtnRow}>
                  <button type="button" className={styles.cta} onClick={() => navigate('/offres')}>
                    Continuer vers le paiement sécurisé
                  </button>
                  <button type="button" className={styles.menopauseSecondaryBtn} onClick={() => navigate('/premium')}>
                    Découvrir l’expérience Premium
                  </button>
                </div>
              </div>
            )}

            <p className={styles.menopausePhaseNote}>
              Phase actuelle : on consolide d’abord le programme classique (stabilité, accès, PDF, validations). Le
              développement approfondi de ce parcours ménopause viendra ensuite, en douceur.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
