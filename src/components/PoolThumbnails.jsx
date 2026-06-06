import { Waves } from 'lucide-react';
import './PoolThumbnails.css';

function PoolThumbnails({ className = '', onPointerDown, ariaHidden = true }) {
  return (
    <div
      className={`pool-thumbs ${className}`.trim()}
      onPointerDown={onPointerDown}
      {...(ariaHidden ? { 'aria-hidden': true } : {})}
    >
      <div className="pool-thumbs__item">
        <Waves size={20} />
      </div>
      <div className="pool-thumbs__item pool-thumbs__item--alt">
        <span>🏊</span>
      </div>
      <div className="pool-thumbs__item pool-thumbs__item--alt2">
        <span>🦭</span>
      </div>
    </div>
  );
}

export default PoolThumbnails;
