import { openDatabase } from './connection.js'
import { checkDatabaseFile } from './database-file-check.js'
import { migrateToLatest } from './migrator.js'

// npm run migrate: aplica as migrations pendentes em desenvolvimento (ADR 0015).
const path = process.env['DATABASE_PATH'] ?? '../censo.sqlite'
checkDatabaseFile(path)
const db = openDatabase({ path, readonly: false })
try {
    const applied = await migrateToLatest(db)
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'No pending migrations.')
} finally {
    await db.destroy()
}
