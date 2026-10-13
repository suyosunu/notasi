import { useEffect, useState } from 'preact/hooks'

function currentRoute(): string {
  const path = location.hash.replace(/^#/, '')
  return path === '' ? '/' : path
}

export function useRoute(): string {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    onChange()
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(path: string): void {
  location.hash = '#' + path
}

/** Geçmişe kayıt eklemeden yönlendirir (geri tuşu yönlendirme döngüsüne düşmesin); `hashchange` yine tetiklenir. */
export function replaceRoute(path: string): void {
  location.replace('#' + path)
}
