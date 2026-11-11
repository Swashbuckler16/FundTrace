param([string]$NodeVersion = '24.20.0', [string]$RuntimeArchive = '')
$ErrorActionPreference = 'Stop'
if ($NodeVersion -notmatch '^24\.\d+\.\d+$') { throw 'Use a Node 24 LTS version.' }
$repo = Split-Path -Parent $PSScriptRoot
$buildId = [guid]::NewGuid().ToString('N').Substring(0,8)
$build = Join-Path $repo "artifacts\portable-$buildId"
$package = Join-Path $build 'FundTrace'
$runtimeName = "node-v$NodeVersion-win-x64"
$archive = Join-Path $build "$runtimeName.zip"
New-Item -ItemType Directory -Path $package -Force | Out-Null
$base = "https://nodejs.org/dist/v$NodeVersion"
Invoke-WebRequest "$base/SHASUMS256.txt" -OutFile (Join-Path $build 'SHASUMS256.txt')
$line = Get-Content (Join-Path $build 'SHASUMS256.txt') | Where-Object { $_ -match "  $([regex]::Escape($runtimeName)).zip$" }
if (-not $line) { throw 'Runtime checksum was not found in the official manifest.' }
if ($RuntimeArchive) { Copy-Item -LiteralPath $RuntimeArchive -Destination $archive }
else { Invoke-WebRequest "$base/$runtimeName.zip" -OutFile $archive }
$expected = ($line -split '\s+')[0]
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) { throw 'Node runtime checksum mismatch.' }
Expand-Archive -LiteralPath $archive -DestinationPath $build
New-Item -ItemType Directory -Path (Join-Path $package 'runtime'), (Join-Path $package 'scripts') | Out-Null
Copy-Item -LiteralPath (Join-Path $build "$runtimeName\node.exe"), (Join-Path $build "$runtimeName\LICENSE") -Destination (Join-Path $package 'runtime')
foreach ($name in @('src', 'docs')) { Copy-Item -LiteralPath (Join-Path $repo $name) -Destination $package -Recurse }
$public = Join-Path $package 'public'
New-Item -ItemType Directory -Path $public | Out-Null
Get-ChildItem -LiteralPath (Join-Path $repo 'public') -File | Where-Object { $_.Extension -in @('.js', '.css', '.html') } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $public }
Copy-Item -LiteralPath (Join-Path $repo 'public\vendor') -Destination $public -Recurse
foreach ($name in @('package.json', 'README.md', 'Start FundTrace.cmd', 'Restore FundTrace.cmd', 'Unlock FundTrace.cmd')) { Copy-Item -LiteralPath (Join-Path $repo $name) -Destination $package }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'recovery.mjs') -Destination (Join-Path $package 'scripts')
Copy-Item -LiteralPath (Join-Path $repo 'docs\OFFLINE-GUIDE.md') -Destination (Join-Path $package 'READ ME FIRST.txt')
@{ nodeVersion = $NodeVersion; source = "$base/$runtimeName.zip"; archiveSha256 = $expected; builtAt = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $package 'runtime\provenance.json') -Encoding UTF8
$zip = Join-Path $repo "artifacts\FundTrace-win-x64-$buildId.zip"
Compress-Archive -LiteralPath $package -DestinationPath $zip
Write-Output "Portable folder: $package"
Write-Output "Offline distribution: $zip"
Get-FileHash -LiteralPath $zip -Algorithm SHA256
