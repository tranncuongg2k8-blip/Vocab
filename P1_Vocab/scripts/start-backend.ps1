$ErrorActionPreference = 'Stop'
$serverPath = Join-Path $PSScriptRoot '../livrables/backend/src/server.js'
& node $serverPath
exit $LASTEXITCODE
