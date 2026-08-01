$lines = Get-Content 'backend\src\controllers\attendance.controller.ts'
$part1 = $lines | Select-Object -First 135
$part2 = $lines | Select-Object -Skip 283
$part1 + $part2 | Set-Content 'backend\src\controllers\attendance.controller.ts'
