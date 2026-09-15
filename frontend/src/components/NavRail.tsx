import { NAV_ITEMS } from './navItems'
import './NavRail.css'

type NavRailProps = {
  active: string
  onSelect: (id: string) => void
}

export default function NavRail({ active, onSelect }: NavRailProps) {
  return (
    <nav className="nav-rail" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-rail-item${active === item.id ? ' active' : ''}`}
          onClick={() => onSelect(item.id)}
          title={item.label}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span className="nav-rail-icon">{item.icon}</span>
          <span className="nav-rail-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
