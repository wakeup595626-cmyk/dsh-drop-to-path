param([Parameter(Mandatory = $true)][string]$OutPath)
# Extract a bitmap from the Windows clipboard and save it as PNG.
# Browsers cannot consume CF_BITMAP (e.g. items restored from the Win+V
# history panel), but .NET can — this bridges the gap for the host route.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
try {
  $img = [System.Windows.Forms.Clipboard]::GetImage()
  if ($null -eq $img) { Write-Output 'NO_IMAGE'; exit 0 }
  $dir = [System.IO.Path]::GetDirectoryName($OutPath)
  if (-not [System.IO.Directory]::Exists($dir)) { [System.IO.Directory]::CreateDirectory($dir) | Out-Null }
  $img.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()
  Write-Output ('SAVED:' + $OutPath)
} catch {
  Write-Output ('ERROR:' + $_.Exception.Message)
}
