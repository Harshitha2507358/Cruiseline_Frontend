import { useState, useEffect, useCallback } from 'react'
import { voyageService } from '../api/services/voyages.js'
import { userService } from '../api/services/users.js'
import { excursionService } from '../api/services/excursions.js'
import { errMsg } from '../api/client.js'

// Each hook returns { options: [{ value, label, sublabel }], error, reload }.

export function useVoyageOptions({ openOnly = false } = {}) {
  const [options, setOptions] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const page = await voyageService.list({ page: 0, size: 200, status: openOnly ? 'OPEN' : undefined })
      setOptions((page?.content || []).map((v) => ({
        value: String(v.voyageId),
        label: v.voyageName,
        sublabel: `#${v.voyageId} · ${v.homePort} · ${v.status}`,
      })))
    } catch (e) { setError(errMsg(e)) }
  }, [openOnly])
  useEffect(() => { load() }, [load])
  return { options, error, reload: load }
}

// enabled=false skips the /directory call entirely (so passengers never trigger a 403).
export function usePassengerOptions(enabled = true) {
  const [options, setOptions] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const page = await userService.directory({ role: 'PASSENGER', page: 0, size: 200 })
      setOptions((page?.content || []).map((u) => ({
        value: String(u.userId),
        label: u.name || u.email,
        sublabel: `#${u.userId} · ${u.email}`,
      })))
    } catch (e) { setError(errMsg(e)) }
  }, [enabled])
  useEffect(() => { load() }, [load])
  return { options, error, reload: load }
}

export function useUserOptions(enabled = true) {
  const [options, setOptions] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const page = await userService.directory({ page: 0, size: 200 })
      setOptions((page?.content || []).map((u) => ({
        value: String(u.userId),
        label: u.name || u.email,
        sublabel: `#${u.userId} · ${u.role}`,
      })))
    } catch (e) { setError(errMsg(e)) }
  }, [enabled])
  useEffect(() => { load() }, [load])
  return { options, error, reload: load }
}

export function useExcursionOptions() {
  const [options, setOptions] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const page = await excursionService.list({ page: 0, size: 200 })
      setOptions((page?.content || []).map((x) => ({
        value: String(x.excursionId),
        label: x.excursionName,
        sublabel: `#${x.excursionId} · ${x.portOfCall}`,
      })))
    } catch (e) { setError(errMsg(e)) }
  }, [])
  useEffect(() => { load() }, [load])
  return { options, error, reload: load }
}

// Resolve an id to a label from an options array (for table display).
export function labelFor(options, id, prefix = '#') {
  if (id === null || id === undefined || id === '') return '—'
  const found = options.find((o) => String(o.value) === String(id))
  return found ? found.label : `${prefix}${id}`
}