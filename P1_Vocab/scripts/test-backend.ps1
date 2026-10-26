$ErrorActionPreference = 'Stop'
$backendPath = Join-Path $PSScriptRoot '../livrables/backend'
Push-Location $backendPath
try {
    & node --test
    $testExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}
exit $testExitCode
