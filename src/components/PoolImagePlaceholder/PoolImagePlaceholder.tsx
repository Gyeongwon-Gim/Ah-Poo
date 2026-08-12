import { Waves } from 'lucide-react';
import './PoolImagePlaceholder.css';

interface PoolImagePlaceholderProps {
  size?: number;
}

const PoolImagePlaceholder = ({ size = 24 }: PoolImagePlaceholderProps) => (
  <div className="pool-image-placeholder" aria-hidden>
    <Waves size={size} />
  </div>
);

export default PoolImagePlaceholder;
