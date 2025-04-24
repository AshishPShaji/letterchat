# PowerShell script to run Next.js dev server with potential fixes for EINVAL issues

# First, clear the .next directory
Write-Host "Clearing .next directory..." -ForegroundColor Cyan
if (Test-Path -Path ".next") {
    try {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
        Write-Host ".next directory removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove .next directory: $_" -ForegroundColor Red
    }
}

# Create a clean .next directory with proper permissions
Write-Host "Creating fresh .next directory..." -ForegroundColor Cyan
New-Item -Path ".next" -ItemType Directory -Force | Out-Null

# Set permissive ACLs on the .next directory
try {
    $acl = Get-Acl -Path ".next"
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name, 
        "FullControl", 
        "ContainerInherit,ObjectInherit", 
        "None", 
        "Allow")
    $acl.AddAccessRule($rule)
    Set-Acl -Path ".next" -AclObject $acl -ErrorAction Stop
    
    Write-Host "Set full permissions on .next directory" -ForegroundColor Green
} catch {
    Write-Host "Failed to set permissions: $_" -ForegroundColor Red
}

# Run the Next.js dev server
Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
npm run dev 