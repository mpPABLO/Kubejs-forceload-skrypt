const MAX_CHUNKS = 2000
const CHECK_INTERVAL = 20
const DATA_KEY = 'autoload_chunks'
const TARGET_DIM = 'compactmachines:compact_world'

let known = null

function loadKnown(server) {
    known = new Set()
    let raw = server.persistentData.getString(DATA_KEY)
    if (raw && raw.length > 0) {
        raw.split(';').forEach(entry => {
            if (entry.length > 0 && entry.split('|')[0] === TARGET_DIM) known.add(entry)
        })
    }
}

function saveKnown(server) {
    server.persistentData.putString(DATA_KEY, Array.from(known).join(';'))
}

function applyForceload(server, entry) {
    let parts = entry.split('|')
    let dim = parts[0]
    let cx = parseInt(parts[1])
    let cz = parseInt(parts[2])
    server.runCommandSilent('execute in ' + dim + ' run forceload add ' + (cx * 16) + ' ' + (cz * 16))
}

ServerEvents.loaded(event => {
    let server = event.server
    loadKnown(server)
    known.forEach(entry => applyForceload(server, entry))
})

ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % CHECK_INTERVAL !== 0) return
    if (known === null) loadKnown(server)

    let changed = false
    server.players.forEach(player => {
        let dim = String(player.level.dimension)
        if (dim !== TARGET_DIM) return
        let cx = player.blockX >> 4
        let cz = player.blockZ >> 4
        let entry = dim + '|' + cx + '|' + cz
        if (known.has(entry)) return
        if (known.size >= MAX_CHUNKS) return
        known.add(entry)
        applyForceload(server, entry)
        changed = true
    })

    if (changed) saveKnown(server)
})