import { useNavigate } from 'react-router-dom';
import {
  FREE_PROGRAM_WEEKS_VISIBLE_CAP,
  FREE_TIER_WEIGHT_HISTORY_VISIBLE,
  PREMIUM_PROGRAM_WEEKS_VISIBLE_CAP,
} from '../../lib/productTier';
import {
  FREE_MEAL_ALTERNATIVE_LIMIT,
  PREMIUM_MEAL_ALTERNATIVE_LIMIT,
  getDailyReplacementLimit,
} from '../../lib/menuEngine';
import { getCoursesDaysLimit } from '../../lib/shoppingList';
import { PremiumLivingPanel } from './PremiumLivingPanel';
import styles from './PremiumHubPanel.module.css';

type Props = {
  hasPremiumAccess: boolean;
  isAdminUser: boolean;
  userId?: string | null;
};

export function PremiumHubPanel({ hasPremiumAccess, isAdminUser, userId }: Props) {
  const navigate = useNavigate();
  const freeCoursesDays = getCoursesDaysLimit(false);
  const premiumCoursesDays = getCoursesDaysLimit(true);
  const freeReplacements = getDailyReplacementLimit(false);
  const premiumReplacements = getDailyReplacementLimit(true);

  return (
    <div className={`${styles.hub} ${hasPremiumAccess ? styles.hubSubscriber : ''}`}>
      <div className={styles.halo} aria-hidden />
      <header className={styles.hero}>
        <p className={styles.heroKicker}>Programme classique</p>
        <h1 className={styles.heroTitle}>Une expérience plus fluide, plus douce, plus personnalisée</h1>
        <p className={styles.heroLead}>
          Le gratuit permet déjà de prendre soin de soi simplement. Le Premium va plus loin avec plus de confort, plus de
          suivi et une expérience plus complète au quotidien.
        </p>
      </header>

      {hasPremiumAccess ? (
        <p className={styles.activeBanner}>
          {isAdminUser
            ? '✨ Premium actif — mode administratrice : mêmes accès qu’un abonnement complet.'
            : '✨ Premium actif — tout ce qui suit est déjà à ta disposition, en douceur.'}
        </p>
      ) : null}

      <section className={styles.compareSection} aria-labelledby="premium-compare-heading">
        <h2 id="premium-compare-heading" className={styles.sectionHeading}>
          Gratuit et Premium, côte à côte
        </h2>
        <p className={styles.sectionIntro}>
          Comparaison alignée sur le fonctionnement actuel de l’app — pas de promesse de santé, pas de vidéos, juste ce
          que tu peux vraiment faire ici.
        </p>
        <div className={styles.tableScroll}>
          <table className={styles.compareTable}>
            <caption className={styles.srOnly}>
              Comparaison des fonctions EquilibreMoi en gratuit et en Premium
            </caption>
            <thead>
              <tr>
                <th scope="col" className={styles.thFeature}>
                  Fonctionnalité
                </th>
                <th scope="col" className={styles.thTier}>
                  Gratuit
                </th>
                <th scope="col" className={styles.thTierPremium}>
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              <TableRow
                feature="Programme & menus personnalisés"
                free="✓"
                premium="✓"
              />
              <TableRow
                feature="Semaines visibles dans l’app (navigation)"
                free={`Jusqu’à ${FREE_PROGRAM_WEEKS_VISIBLE_CAP} sem.`}
                premium={`Jusqu’à ${PREMIUM_PROGRAM_WEEKS_VISIBLE_CAP} sem. (~2 mois)`}
              />
              <TableRow feature="Allergies & exclusions" free="✓" premium="✓" />
              <TableRow feature="Adaptation saisonnière des repas" free="✓" premium="✓" />
              <TableRow feature="Quantités détaillées (g, ml, cuillères…)" free="✓" premium="✓" />
              <TableRow
                feature="Liste de courses"
                free={`Jusqu’à ${freeCoursesDays} jours`}
                premium={`Jusqu’à ${premiumCoursesDays} jours, plus confortable au quotidien`}
              />
              <TableRow
                feature="Budget cuisines"
                free="Enregistré (personnalisation poussée en Premium)"
                premium="Intégré aux propositions de menus"
              />
              <TableRow
                feature="Remplacements de repas par jour"
                free={String(freeReplacements)}
                premium={String(premiumReplacements)}
              />
              <TableRow
                feature="Idées proposées à chaque remplacement"
                free={String(FREE_MEAL_ALTERNATIVE_LIMIT)}
                premium={String(PREMIUM_MEAL_ALTERNATIVE_LIMIT)}
              />
              <TableRow
                feature="Recettes & fiches repas"
                free="Quotidiennes + recettes « découverte »"
                premium="Bibliothèque élargie (dont fiches réservées)"
              />
              <TableRow feature="Validation des repas" free="✓" premium="✓" />
              <TableRow
                feature="Suivi du poids"
                free={`Résumé · ${FREE_TIER_WEIGHT_HISTORY_VISIBLE} derniers relevés affichés`}
                premium="Historique complet dans l’app"
              />
              <TableRow
                feature="Petits messages d’encouragement (popup accueil)"
                free="1 par jour"
                premium="Illimité"
              />
              <TableRow
                feature="Fiches « Comprendre » & besoin du moment"
                free="Aperçu"
                premium="Accès complet aux fiches"
              />
              <TableRow
                feature="Pistes douces sur tes habitudes"
                free="—"
                premium="Observations bienveillantes dans l’onglet Suivi"
              />
              <TableRow
                feature="Exports PDF magazine (menus, courses, bilan…)"
                free="—"
                premium="✓"
              />
              <TableRow
                feature="Ambiance visuelle (halos, saison)"
                free="Interface soignée pour toutes"
                premium="Touches or & halos discrets supplémentaires"
              />
              <TableRow feature="Badge sur le profil" free="—" premium="✓" />
            </tbody>
          </table>
        </div>
      </section>

      {hasPremiumAccess ? (
        <section className={styles.livingSection} aria-label="Aperçu du jour">
          <h2 className={styles.sectionHeading}>Un peu d’attention pour toi</h2>
          <PremiumLivingPanel userId={userId} />
        </section>
      ) : null}

      <section className={styles.detailBlocks} aria-label="Détails Premium">
        <article className={styles.detailCard}>
          <h3 className={styles.detailTitle}>Menus & repas</h3>
          <ul className={styles.detailList}>
            <li>Même base personnalisée pour toutes : régime, saison, exclusions.</li>
            <li>
              En Premium : plus de semaines à parcourir dans l’app, plus de remplacements par jour et plus de
              propositions à chaque changement.
            </li>
            <li>
              Les menus se recalculent quand ton profil évolue ; l’objectif est le confort, pas la course aux
              fonctionnalités.
            </li>
          </ul>
        </article>
        <article className={styles.detailCard}>
          <h3 className={styles.detailTitle}>Courses & budget</h3>
          <ul className={styles.detailList}>
            <li>
              Liste générée à partir de tes repas : {freeCoursesDays} jours en gratuit, {premiumCoursesDays} jours en
              Premium.
            </li>
            <li>En Premium, ton budget peut davantage influencer les menus proposés.</li>
            <li>Exports PDF soignés réservés au Premium (menus, courses, bilans).</li>
          </ul>
        </article>
        <article className={styles.detailCard}>
          <h3 className={styles.detailTitle}>Suivi & ressenti</h3>
          <ul className={styles.detailList}>
            <li>Historique de poids : aperçu limité en gratuit, complet en Premium.</li>
            <li>
              « Corrélations douces » : phrases bienveillantes dans l’onglet Suivi — jamais médical, jamais culpabilisant.
            </li>
            <li>Rapports PDF pour relire ton évolution comme un petit magazine.</li>
          </ul>
        </article>
        <article className={styles.detailCard}>
          <h3 className={styles.detailTitle}>Confort & cadre</h3>
          <ul className={styles.detailList}>
            <li>Messages du jour : un en gratuit, sans limite en Premium.</li>
            <li>Fiches « Comprendre » : débloquées entièrement en Premium.</li>
            <li>Détails d’interface discrets (lumière, badge) pour marquer ton espace Premium.</li>
          </ul>
        </article>
      </section>

      <div className={styles.plans}>
        <article className={styles.planCard}>
          <span className={styles.eyebrow}>Mensuel</span>
          <p className={styles.planPrice}>9,90€ / mois</p>
          <p className={styles.planNote}>Pour avancer à ton rythme, en restant libre de ton engagement.</p>
        </article>
        <article className={`${styles.planCard} ${styles.planBest}`}>
          <span className={styles.planBadge}>Le plus doux</span>
          <span className={styles.eyebrow}>Annuel</span>
          <p className={styles.planPrice}>99€ / an</p>
          <p className={styles.planNote}>Environ deux mois offerts sur l’année — idéal pour ancrer une routine.</p>
        </article>
      </div>

      <footer className={styles.footer}>
        {hasPremiumAccess ? (
          <p className={styles.footnote}>Merci de faire confiance à EquilibreMoi 💖</p>
        ) : (
          <>
            <button type="button" className={styles.cta} onClick={() => navigate('/offres')}>
              Voir les offres et passer en Premium
            </button>
            <p className={styles.footnote}>Paiement sécurisé · Tu restes maîtresse de ton abonnement</p>
          </>
        )}
        <p className={styles.menopauseNote}>
          Un espace ménopause plus approfondi arrivera progressivement — séparé du programme classique, sans mélanger les
          parcours.
        </p>
      </footer>
    </div>
  );
}

function TableRow({ feature, free, premium }: { feature: string; free: string; premium: string }) {
  return (
    <tr>
      <th scope="row" className={styles.tdFeature}>
        {feature}
      </th>
      <td className={styles.tdCell}>{free}</td>
      <td className={styles.tdCellPremium}>{premium}</td>
    </tr>
  );
}
