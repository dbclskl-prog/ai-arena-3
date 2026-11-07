param(
  [Parameter(Mandatory=$true)]
  [string]$GitHubRepoUrl
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "🚀 Đang cấu hình Git Remote tới: $GitHubRepoUrl" -ForegroundColor Cyan
git branch -M main

$existingRemote = git remote
if ($existingRemote -contains "origin") {
  git remote set-url origin $GitHubRepoUrl
} else {
  git remote add origin $GitHubRepoUrl
}

Write-Host "☁️ Đang đẩy toàn bộ mã nguồn AI Arena 3.0 lên GitHub (nhánh main)..." -ForegroundColor Green
git push -u origin main --force

Write-Host "`n====================================================================" -ForegroundColor Yellow
Write-Host "🎉 ĐÃ UPLOAD CODE LÊN GITHUB THÀNH CÔNG!" -ForegroundColor Green
Write-Host "👉 Bước cuối để nhận tên miền cố định https://ai-arena-3-skyline.onrender.com :" -ForegroundColor Cyan
Write-Host "   1. Mở: https://dashboard.render.com/blueprints"
Write-Host "   2. Bấm 'New Blueprint Instance' -> Chọn kho GitHub vừa đẩy lên"
Write-Host "   3. Bấm 'Apply' -> Render tự động chạy server 24/7!"
Write-Host "====================================================================`n" -ForegroundColor Yellow
