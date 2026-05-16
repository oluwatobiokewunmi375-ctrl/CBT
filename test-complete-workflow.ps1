#!/usr/bin/env pwsh

# Configuration
$BaseURL = "http://localhost:3000"
$TestResults = @()
$Headers = @{ "Content-Type" = "application/json" }

# Helper function to make API calls
function Invoke-CBTApi {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Token
    )
    
    try {
        $URL = "$BaseURL$Endpoint"
        $RequestHeaders = $Headers.Clone()
        
        if ($Token) {
            $RequestHeaders["Authorization"] = "Bearer $Token"
        }
        
        $Params = @{
            Uri = $URL
            Method = $Method
            Headers = $RequestHeaders
        }
        
        if ($Body) {
            $Params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $Response = Invoke-WebRequest @Params -ErrorAction Stop
        return $Response.Content | ConvertFrom-Json
    }
    catch {
        Write-Host "Request failed: $_"
        return $null
    }
}

Write-Host "================================" -ForegroundColor Magenta
Write-Host "CBT COMPLETE WORKFLOW TEST" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host "Starting comprehensive workflow tests..." -ForegroundColor Cyan

# Phase 1: Test Super Admin Creation
Write-Host "`nPHASE 1: AUTHENTICATION & USER SETUP" -ForegroundColor Cyan

Write-Host "Creating Super Admin user..."
$SuperAdminData = @{
    email = "superadmin@test.com"
    password = "SuperAdmin123!"
    fullName = "System Administrator"
    setupKey = "default-setup-key"
}

$SuperAdminResult = Invoke-CBTApi -Method "POST" -Endpoint "/api/admin/super-admin" -Body $SuperAdminData

if ($SuperAdminResult -and ($SuperAdminResult.id -or $SuperAdminResult.data.id)) {
    $SuperAdminId = if ($SuperAdminResult.id) { $SuperAdminResult.id } else { $SuperAdminResult.data.id }
    Write-Host "✅ Super Admin created: $SuperAdminId" -ForegroundColor Green
    $TestResults += @{ Test = "Create Super Admin"; Status = "PASS" }
} else {
    Write-Host "❌ Failed to create Super Admin" -ForegroundColor Red
    if ($SuperAdminResult) {
        Write-Host "Response: $($SuperAdminResult | ConvertTo-Json)" -ForegroundColor Red
    }
    $TestResults += @{ Test = "Create Super Admin"; Status = "FAIL" }
}

Write-Host "`nTest Summary:" -ForegroundColor Yellow
$TestResults | Format-Table -AutoSize
