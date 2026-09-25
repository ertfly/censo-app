import { buildProtectionReport } from './protection-report.js'

// npm run protection:report (docker compose exec backend npm run protection:report).
const dir = process.env['PROTECTION_LOG_DIR'] ?? '/var/lib/censo/protection-log'

try {
    const report = buildProtectionReport(dir)
    if (report.length === 0) {
        console.log('No protection events in the last days.')
    }
    for (const day of report) {
        const { invalid_solution, expired_challenge, replayed_challenge } = day.failures
        console.log(`\n${day.day}`)
        console.log(`  Rate limit blocks: ${day.blocks}`)
        console.log(
            `  Verification failures: invalid ${invalid_solution}, expired ${expired_challenge}, replayed ${replayed_challenge}`,
        )
        for (const { accessId, events } of day.topAccessIds) {
            console.log(`  ${accessId}  ${events}`)
        }
    }
} catch (error) {
    console.error(
        `Could not read ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(1)
}
