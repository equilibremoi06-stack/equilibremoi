import type { SeasonalTheme } from '../../utils/seasonalTheme';

type Props = { theme: SeasonalTheme };

export function SeasonalDecor({ theme }: Props) {
  const { decorationType } = theme;

  return (
    <div className="seasonal-decor" aria-hidden>
      <div className="seasonal-decor-inner">
        {decorationType === 'petals' && (
          <>
            <span className="seasonal-petal" />
            <span className="seasonal-petal" />
            <span className="seasonal-petal" />
            <span className="seasonal-petal" />
          </>
        )}
        {decorationType === 'sun-halo' && <div className="seasonal-sun-halo" />}
        {decorationType === 'leaves' && (
          <>
            <span className="seasonal-leaf" />
            <span className="seasonal-leaf" />
            <span className="seasonal-leaf" />
          </>
        )}
        {decorationType === 'frost-shimmer' && <div className="seasonal-frost" />}
        {decorationType === 'hearts-soft' && (
          <>
            <span className="seasonal-heart" style={{ top: '14%', left: '16%' }} />
            <span className="seasonal-heart" style={{ top: '22%', right: '20%' }} />
          </>
        )}
        {decorationType === 'gold-glow' && <div className="seasonal-womens-aura" />}
        {decorationType === 'easter-eggs' && (
          <>
            <span className="seasonal-egg" />
            <span className="seasonal-egg" />
            <span className="seasonal-egg" />
          </>
        )}
        {decorationType === 'pumpkin-moon' && (
          <>
            <div className="seasonal-moon" />
            <div className="seasonal-pumpkin" />
          </>
        )}
        {decorationType === 'sparkle-tree' && (
          <>
            <span className="seasonal-sparkle" style={{ top: '18%', left: '22%' }} />
            <span className="seasonal-sparkle" style={{ top: '28%', right: '30%' }} />
            <span className="seasonal-sparkle" style={{ bottom: '24%', left: '40%' }} />
            <div className="seasonal-advent-strip" />
          </>
        )}
      </div>
    </div>
  );
}
