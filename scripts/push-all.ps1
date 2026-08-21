# push-all.ps1 — 一键双推：cnb.cool 直推 master + GitHub 走 PR（受保护分支）
#
# 用法：  ./scripts/push-all.ps1
# 或：    git push-all   （git alias 已指向此脚本）
#
# 流程：
#   1. git push cnb master                    → cnb.cool 直推（无分支保护）
#   2. git push origin master:auto-sync       → GitHub 推到 auto-sync 分支（绕过保护）
#   3. GitHub API 查找/创建 PR (auto-sync → master)
#   4. 若 PR 已存在且 open，直接 merge（分支保护不要求 approve，自己可合并）
#
# 凭据：token 运行时从 Windows Git Credential Manager 读取，不硬编码在脚本里。

# Continue（不用 Stop）：git 的进度/错误写 stderr，PowerShell 5.1 会把
# 重定向后的 stderr 升级为异常中断脚本；所有 git 命令均已用 $LASTEXITCODE
# 检查失败，GitHub API 调用均有 try/catch，不需要 Stop 级处理。
$ErrorActionPreference = 'Continue'
$PSNativeCommandUseErrorActionPreference = $false

# ── 配置 ──────────────────────────────────────────────────────────────────
$RepoPath = Split-Path -Parent $PSScriptRoot          # 仓库根目录（脚本在 scripts/ 下）
$Owner = 'Shrbuz'
$Repo = 'dsh-web-notes'
$SyncBranch = 'auto-sync'
$BaseBranch = 'master'
$ApiBase = "https://api.github.com/repos/$Owner/$Repo"

# ── 从 GCM 读取 GitHub token ─────────────────────────────────────────────
function Get-GitHubToken {
    $input = "protocol=https`nhost=github.com`n`n"
    $cred = $input | git credential fill 2>$null
    $token = ($cred | Where-Object { $_ -match '^password=' }) -replace '^password=', ''
    if (-not $token) { throw '无法从 Git Credential Manager 获取 GitHub token（请先 git push 登录一次）' }
    return $token
}

# ── GitHub API 调用 ───────────────────────────────────────────────────────
$script:GhToken = $null
function Invoke-GhApi {
    param([string]$Method, [string]$Path, $Body = $null)
    $headers = @{
        'Accept'        = 'application/vnd.github+json'
        'Authorization' = "Bearer $script:GhToken"
        'X-GitHub-Api-Version' = '2022-11-28'
    }
    $params = @{ Uri = "$ApiBase$Path"; Method = $Method; Headers = $headers; TimeoutSec = 20; UseBasicParsing = $true }
    if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 6); $params.ContentType = 'application/json' }
    try { return (Invoke-WebRequest @params).Content | ConvertFrom-Json }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        # 404 视为"不存在"，返回 $null 由调用方决定
        if ($code -eq 404) { return $null }
        throw "GitHub API $Method $Path 失败 (HTTP $code): $detail"
    }
}

# ── 主流程 ───────────────────────────────────────────────────────────────
Write-Host "== dsh-web-notes push-all ==" -ForegroundColor Cyan
Set-Location $RepoPath

# 1. 同步远程引用（用 cmd 包装避免 PowerShell 把 git stderr 当异常）
cmd /c "git fetch origin" 2>$null | Out-Null
cmd /c "git fetch cnb" 2>$null | Out-Null

# 2. cnb 直推 master
Write-Host "`n[1/4] 推送 cnb.cool master ..." -ForegroundColor Yellow
cmd /c "git push cnb master"
if ($LASTEXITCODE -ne 0) { Write-Host 'cnb 推送失败' -ForegroundColor Red; exit 1 }
Write-Host '  cnb.cool ✓' -ForegroundColor Green

# 3. GitHub 推到 auto-sync 分支（绕开 master 分支保护）
Write-Host "[2/4] 推送 GitHub auto-sync 分支 ..." -ForegroundColor Yellow
cmd /c "git push origin master:$SyncBranch"
if ($LASTEXITCODE -ne 0) { Write-Host 'GitHub 推送失败' -ForegroundColor Red; exit 1 }
Write-Host "  github.com/$Owner/$Repo/tree/$SyncBranch ✓" -ForegroundColor Green

# 4. 读取 token 并处理 PR
$script:GhToken = Get-GitHubToken

# 4a. 先比较 master 与 auto-sync：若 GitHub master 已包含 auto-sync 的全部提交，无需 PR
Write-Host "[3/4] 比较 master 与 auto-sync ..." -ForegroundColor Yellow
$compare = Invoke-GhApi -Method GET -Path "/compare/$BaseBranch...$SyncBranch"
if ($null -eq $compare) { throw "GitHub API compare 失败" }
if ($compare.status -eq 'identical' -or $compare.ahead_by -eq 0) {
    Write-Host "  GitHub master 已包含 auto-sync 全部提交，无需 PR" -ForegroundColor Green
    # 清理 auto-sync 分支后直接结束
    $deleteOut = cmd /c "git push origin --delete $SyncBranch" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "  auto-sync 分支已删除" -ForegroundColor Green }
    Write-Host "`n完成！cnb.cool 与 GitHub 已同步（无新提交）。" -ForegroundColor Cyan
    exit 0
}
Write-Host "  发现 $($compare.ahead_by) 个待同步提交" -ForegroundColor Yellow

# 4b. 查找已存在的 open PR (auto-sync → master)
$openPrs = Invoke-GhApi -Method GET -Path "/pulls?state=open&head=$Owner`:$SyncBranch&base=$BaseBranch"
$pr = $null
if ($openPrs -and $openPrs.Count -gt 0) { $pr = $openPrs[0] }

if ($null -eq $pr) {
    # 4c. 创建 PR
    Write-Host "  未找到 open PR，创建新 PR ..." -ForegroundColor Yellow
    $pr = Invoke-GhApi -Method POST -Path '/pulls' -Body @{
        title = "chore: sync master to GitHub ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
        head  = $SyncBranch
        base  = $BaseBranch
        body  = "自动同步提交（由 scripts/push-all.ps1 生成）`n`n保持 GitHub 与 cnb.cool / 本地 master 一致。"
    }
    Write-Host "  PR #$($pr.number) 已创建: $($pr.html_url)" -ForegroundColor Green
} else {
    Write-Host "  复用现有 PR #$($pr.number): $($pr.html_url)" -ForegroundColor Green
}

# 4d. merge（分支保护不要求 approve，自己可直接合并；如需人工审阅可注释本段）
Write-Host "[4/4] merge PR ..." -ForegroundColor Yellow
try {
    $merged = Invoke-GhApi -Method PUT -Path "/pulls/$($pr.number)/merge" -Body @{
        commit_title = "merge: auto-sync → master ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
        merge_method = 'merge'
    }
    if ($merged.merged) { Write-Host "  PR #$($pr.number) 已合并 ✓" -ForegroundColor Green }
    else { Write-Host "  合并返回未确认（可能需要人工处理）: $($merged.message)" -ForegroundColor Yellow }
} catch {
    # merge 可能因无变更等失败，不致命
    Write-Host "  合并失败（可能无新提交或已有冲突）: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. 清理 auto-sync 分支（合并后删除，下次自动重建）
Write-Host "  清理 auto-sync 分支 ..." -ForegroundColor Yellow
$deleteOut = cmd /c "git push origin --delete $SyncBranch" 2>$null
if ($LASTEXITCODE -ne 0) {
    # 分支可能已被 GitHub 自动删除或不存在，不阻塞流程
    Write-Host "  auto-sync 分支清理提示: $deleteOut" -ForegroundColor DarkGray
} else {
    Write-Host "  auto-sync 分支已删除" -ForegroundColor Green
}

Write-Host "`n完成！cnb.cool 与 GitHub 已同步。" -ForegroundColor Cyan
