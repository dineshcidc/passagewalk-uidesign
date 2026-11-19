param([string]$In, [string]$OutDocx, [string]$OutPdf)
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
try {
  $d = $w.Documents.Open($In, $false, $false)
  foreach ($t in $d.TablesOfContents) { $t.Update() }
  $d.Fields.Update() | Out-Null
  $d.Repaginate()
  foreach ($t in $d.TablesOfContents) { $t.UpdatePageNumbers() }
  $d.SaveAs2($OutDocx, 16)   # wdFormatDocumentDefault
  $d.ExportAsFixedFormat($OutPdf, 17, $false, 0, 0, 0, 0, 0, $true, $true, 1, $true, $true, $false)  # PDF, bookmarks from headings
  "pages: " + $d.ComputeStatistics(2)
  $d.Close($false)
} finally { $w.Quit() }
