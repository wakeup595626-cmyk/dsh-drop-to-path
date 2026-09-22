# Lightweight clipboard probe: prints IMAGE when the clipboard carries any
# browser-visible or .NET-visible picture (bitmap handle, png stream, or an
# image file drop), NO_IMAGE otherwise. Used by the host clipboardState route.
Add-Type -AssemblyName System.Windows.Forms
try {
  $d = [System.Windows.Forms.Clipboard]::GetDataObject()
  if ($null -eq $d) { Write-Output 'NO_IMAGE'; exit 0 }
  if ($d.GetDataPresent('Bitmap') -or $d.GetDataPresent('image/png') -or $d.GetDataPresent('DeviceIndependentBitmap')) {
    Write-Output 'IMAGE'; exit 0
  }
  if ($d.GetDataPresent('FileDrop')) {
    $files = $d.GetData([System.Windows.Forms.DataFormats]::FileDrop)
    foreach ($f in $files) {
      if ($f -match '\.(png|jpe?g|webp|gif|bmp)$') { Write-Output 'IMAGE'; exit 0 }
    }
  }
  Write-Output 'NO_IMAGE'
} catch {
  Write-Output ('ERROR:' + $_.Exception.Message)
}
