Add-Type -AssemblyName System.Speech

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputWav = Join-Path $baseDir "narration_final.wav"

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 0  # Normal pacing

# Individual speech lines
$lines = @(
    @{ Text = "Meet SochIQ. A modern data intelligence workspace built for instant analytics."; Delay = 0 },
    @{ Text = "No account required. Jump straight in with temporary cloud persistence and automatic 30-minute cleanup."; Delay = 1 },
    @{ Text = "Drop any CSV, Excel, or JSON table. SochIQ infers your schema, detects null values, and audits data quality in seconds."; Delay = 1 },
    @{ Text = "Explore descriptive statistics, numeric distributions, and automated algorithmic insights."; Delay = 1 },
    @{ Text = "Think smarter. See deeper. Welcome to SochIQ."; Delay = 0 }
)

$synth.SetOutputToWaveFile($outputWav)
foreach ($line in $lines) {
    $synth.Speak($line.Text)
    if ($line.Delay -gt 0) {
        Start-Sleep -Seconds $line.Delay
    }
}
$synth.Dispose()

Write-Host "✓ Narration synthesized to $outputWav"

