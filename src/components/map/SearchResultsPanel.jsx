import { useNavigate } from 'react-router-dom'
import SearchResultItem from './SearchResultItem'
import { getPoolListKey } from '../../utils/poolKey'
import { poolToSearchParams } from '../../utils/poolKey'
import './SearchResultsPanel.css'

function SearchResultsPanel({
  pools,
  searchTerm,
  selectedPool,
  onSelectPool,
  listView = false,
}) {
  const navigate = useNavigate()
  const selectedKey = selectedPool ? getPoolListKey(selectedPool) : null

  const handleSelect = (pool) => {
    if (listView) {
      handleOpenDetail(pool)
      return
    }
    onSelectPool(pool)
  }

  const handleOpenDetail = (pool) => {
    navigate(`/pool?${poolToSearchParams(pool)}`, { state: { from: 'search' } })
  }

  return (
    <section
      className={`search-results-panel ${listView ? 'search-results-panel--list-view' : ''}`}
      aria-label={`'${searchTerm}' 검색 결과`}
    >
      <div className="search-results-panel__handle" aria-hidden />
      <header className="search-results-panel__header">
        <h2 className="search-results-panel__title">
          검색 결과 <span className="search-results-panel__count">{pools.length}</span>
        </h2>
      </header>

      <div className="search-results-panel__list" role="list">
        {pools.length === 0 ? (
          <p className="search-results-panel__empty">검색 결과가 없습니다</p>
        ) : (
          pools.map((pool) => (
            <div key={getPoolListKey(pool)} role="listitem">
              <SearchResultItem
                pool={pool}
                selected={selectedKey === getPoolListKey(pool)}
                onSelect={handleSelect}
              />
              {!listView && selectedKey === getPoolListKey(pool) && (
                <button
                  type="button"
                  className="search-results-panel__detail-btn"
                  onClick={() => handleOpenDetail(pool)}
                >
                  상세 보기
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default SearchResultsPanel
