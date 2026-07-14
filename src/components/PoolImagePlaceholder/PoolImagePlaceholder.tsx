import { Waves } from 'lucide-react';
import './PoolImagePlaceholder.css';

interface PoolImagePlaceholderProps {
  size?: number;
}

export default function PoolImagePlaceholder({
  size = 24,
}: PoolImagePlaceholderProps) {
  return (
    <div className="pool-image-placeholder" aria-hidden>
      <Waves size={size} />
    </div>
  );
}
