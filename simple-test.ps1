# Simple Test Workflow
Write-Host "Starting workflow test..."

cd "c:\Users\laternabooks.ng\Desktop\CBT"

# Check if .env exists
if (Test-Path .env) {
    Write-Host "Environment file exists"
} else {
    Write-Host "Warning: .env file not found"
}

# Check package.json
if (Test-Path package.json) {
    Write-Host "package.json exists"
}

# Try npm run dev
Write-Host "Starting npm dev..."
npm run dev
