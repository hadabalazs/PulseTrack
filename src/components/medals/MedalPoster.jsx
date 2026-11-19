import { posterPath, medalTitle } from '@/lib/medals/catalog';

export default function MedalPoster({ definition, className = '' }) {
  return <img src={posterPath(definition)} alt={medalTitle(definition)} width="256" height="256" loading="lazy" draggable="false" className={`object-contain ${className}`} />;
}
