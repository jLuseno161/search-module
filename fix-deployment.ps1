Write-Host "🚀 Fixing GitHub Pages deployment..." -ForegroundColor Green

# Clean and build
Write-Host "📦 Building Angular app..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist
ng build public --configuration production --base-href "/search-module/"

# Verify build
if (Test-Path "dist/public/index.html") {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed - no index.html found" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "📤 Deploying to gh-pages branch..." -ForegroundColor Yellow
npx angular-cli-ghpages --dir=dist/public --branch=gh-pages --repo=https://github.com/jLuseno161/search-module.git --no-silent

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your site should be at: https://jLuseno161.github.io/search-module/" -ForegroundColor Cyan
Write-Host "⏰ Wait 1-2 minutes for GitHub to update..." -ForegroundColor Yellow