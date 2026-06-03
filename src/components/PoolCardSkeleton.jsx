import './PoolCardSkeleton.css'

function PoolCardSkeleton() {
  return (
    <div className="pool-skeleton" aria-hidden>
      <div className="pool-skeleton__icon" />
      <div className="pool-skeleton__body">
        <div className="pool-skeleton__line pool-skeleton__line--title" />
        <div className="pool-skeleton__line pool-skeleton__line--address" />
        <div className="pool-skeleton__line pool-skeleton__line--short" />
      </div>
    </div>
  )
}

export default PoolCardSkeleton
