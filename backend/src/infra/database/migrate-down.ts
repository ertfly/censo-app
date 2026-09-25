import { openDatabase } from './connection.js'
import { checkDatabaseFile } from './database-file-check.js'
import { migrateDown } from './migrator.js'

// npm run migrate:down: desfaz a última migration aplicada (ADR 0015).
const path = process.env['DATABASE_PATH'] ?? '../censo.sqlite'
checkDatabaseFile(path)
const db = openDatabase({ path, readonly: false })
try {
    const reverted = await migrateDown(db)
    console.log(reverted.length ? `Reverted: ${reverted.join(', ')}` : 'Nothing to revert.')
} finally {
    await db.destroy()
}
