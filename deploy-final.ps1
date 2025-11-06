Write-Host "🚀 Deploying Both Applications..." -ForegroundColor Green

# Deploy Public App
Write-Host "📦 Deploying Public App..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist
ng build public --configuration production
npx angular-cli-ghpages --dir="dist/public/browser" --branch=gh-pages --no-silent

# Deploy Staff App  
Write-Host "👥 Deploying Staff App..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist
ng build staff --configuration production
npx angular-cli-ghpages --dir="dist/staff/browser" --branch=gh-pages --no-silent

Write-Host "🎉 Both apps deployed!" -ForegroundColor Green
Write-Host "🌐 Public App: https://jLuseno161.github.io/search-module/" -ForegroundColor Cyan
Write-Host "👥 Staff App: https://jLuseno161.github.io/search-module/staff/" -ForegroundColor Cyan