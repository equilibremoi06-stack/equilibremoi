import { Link } from 'react-router-dom';
import styles from './QuestionnaireMenopausePage.module.css';

export default function QuestionnaireMenopausePage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Parcours Ménopause</h1>
        <p className={styles.lead}>
          Ton parcours dédié arrive ici : questions adaptées à cette période, au
          même niveau d&apos;attention que le parcours classique — une expérience à
          part entière.
        </p>
        <Link className={styles.back} to="/">
          ← Changer de parcours
        </Link>
      </div>
    </div>
  );
}
