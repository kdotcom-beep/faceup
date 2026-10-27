// Parses Face Up rule files: YAML-ish front matter plus a Markdown body. Shared by the
// site build and the scanner so rule metadata is read one way, from one place.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// ---------- front matter split ----------
export function splitFrontMatter(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error('missing front matter')
  return { fm: m[1], body: m[2] }
}

// Purpose-built parser for the Face Up rule schema (robust for our files).
export function parseSchema(fm) {
  const lines = fm.split('\n')
  const data = { anchor: {}, detectable_by: {}, detection: {} }
  let i = 0
  const val = s => {
    s = s.trim()
    if (s === 'true') return true
    if (s === 'false') return false
    if (/^-?\d+$/.test(s)) return Number(s)
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\"/g, '"')
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1)
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1).trim()
      return inner ? inner.split(',').map(x => val(x)) : []
    }
    return s
  }
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue }
    const topKey = line.match(/^(\w[\w-]*):(.*)$/)
    if (topKey) {
      const key = topKey[1]
      const rest = topKey[2].trim()
      if (key === 'anchor') {
        i++
        while (i < lines.length && /^\s+\S/.test(lines[i])) {
          const sub = lines[i].match(/^\s+([\w-]+):(.*)$/)
          if (!sub) { i++; continue }
          const sk = sub[1]; const sr = sub[2].trim()
          if (sk === 'wcag') {
            const arr = []
            i++
            while (i < lines.length && /^\s{4,}-/.test(lines[i])) {
              const obj = {}
              // first line of item
              const first = lines[i].match(/^\s+-\s+([\w-]+):(.*)$/)
              if (first) obj[first[1]] = val(first[2])
              i++
              while (i < lines.length && /^\s{6,}\S/.test(lines[i]) && !/^\s+-/.test(lines[i])) {
                const p = lines[i].match(/^\s+([\w-]+):(.*)$/)
                if (p) obj[p[1]] = val(p[2])
                i++
              }
              arr.push(obj)
            }
            data.anchor.wcag = arr
          } else if (sr === '') {
            const items = []
            i++
            while (i < lines.length && /^\s{4,}-/.test(lines[i])) {
              items.push(val(lines[i].replace(/^\s+-\s+/, '')))
              i++
            }
            data.anchor[sk] = items
          } else {
            data.anchor[sk] = val(sr)
            i++
          }
        }
        continue
      } else if (key === 'detectable_by' || key === 'detection') {
        i++
        while (i < lines.length && /^\s+\S/.test(lines[i])) {
          const sub = lines[i].match(/^\s+([\w-]+):(.*)$/)
          if (sub) data[key][sub[1]] = val(sub[2])
          i++
        }
        continue
      } else {
        data[key] = val(rest)
        i++
        continue
      }
    }
    i++
  }
  return data
}

export function loadCatalogue(dir) {
  return readdirSync(dir)
    .filter(f => /^faceup-.*\.md$/.test(f))
    .sort()
    .map(f => {
      const { fm, body } = splitFrontMatter(readFileSync(join(dir, f), 'utf8'))
      return { file: f, data: parseSchema(fm), body }
    })
}
