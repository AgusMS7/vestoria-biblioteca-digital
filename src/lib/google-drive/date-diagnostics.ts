/**
 * Sistema de diagnóstico para extracción de fechas
 * Permite trackear qué fuente de fecha se usa para cada archivo
 */

export interface DateDiagnosticResult {
  fileId: string
  fileName: string
  source: 'exif' | 'video_metadata' | 'filename_pattern' | 'created_time' | 'modified_time' | 'none'
  year: number | null
  month?: number
  day?: number
  confidence: 'high' | 'medium' | 'low'
  raw_value?: string
  note?: string
}

export interface DateDiagnosticStats {
  total_files: number
  with_exif: number
  with_video_metadata: number
  with_filename_pattern: number
  with_created_time: number
  with_modified_time: number
  without_date: number
  average_year: number | null
  year_distribution: Record<number, number>
  earliest_year: number | null
  latest_year: number | null
}

class DateDiagnosticsCollector {
  private results: DateDiagnosticResult[] = []
  private stats: DateDiagnosticStats = {
    total_files: 0,
    with_exif: 0,
    with_video_metadata: 0,
    with_filename_pattern: 0,
    with_created_time: 0,
    with_modified_time: 0,
    without_date: 0,
    average_year: null,
    year_distribution: {},
    earliest_year: null,
    latest_year: null,
  }

  addResult(result: DateDiagnosticResult) {
    this.results.push(result)
    this.updateStats(result)
  }

  private updateStats(result: DateDiagnosticResult) {
    this.stats.total_files++

    // Contar por source
    if (result.source === 'exif') this.stats.with_exif++
    else if (result.source === 'video_metadata') this.stats.with_video_metadata++
    else if (result.source === 'filename_pattern') this.stats.with_filename_pattern++
    else if (result.source === 'created_time') this.stats.with_created_time++
    else if (result.source === 'modified_time') this.stats.with_modified_time++
    else if (result.source === 'none') this.stats.without_date++

    // Distribuir años
    if (result.year) {
      this.stats.year_distribution[result.year] =
        (this.stats.year_distribution[result.year] || 0) + 1

      if (!this.stats.earliest_year || result.year < this.stats.earliest_year) {
        this.stats.earliest_year = result.year
      }
      if (!this.stats.latest_year || result.year > this.stats.latest_year) {
        this.stats.latest_year = result.year
      }
    }
  }

  getResults() {
    return this.results
  }

  getStats(): DateDiagnosticStats {
    const yearsWithData = Object.values(this.stats.year_distribution).reduce(
      (a, b) => a + b,
      0
    )
    if (yearsWithData > 0) {
      const avgYear = Math.round(
        Object.entries(this.stats.year_distribution).reduce((sum, [year, count]) => {
          return sum + parseInt(year, 10) * count
        }, 0) / yearsWithData
      )
      this.stats.average_year = avgYear
    }

    return this.stats
  }

  getResultForFile(fileId: string): DateDiagnosticResult | undefined {
    return this.results.find((r) => r.fileId === fileId)
  }

  getSummaryReport(): string {
    const stats = this.getStats()
    const percent = (num: number) =>
      `${((num / stats.total_files) * 100).toFixed(1)}%`

    return `
========== DATE EXTRACTION DIAGNOSTICS ==========

Total files: ${stats.total_files}

Sources used:
- EXIF DateTimeOriginal: ${stats.with_exif} (${percent(stats.with_exif)})
- Video metadata: ${stats.with_video_metadata} (${percent(stats.with_video_metadata)})
- Filename pattern (20XX): ${stats.with_filename_pattern} (${percent(stats.with_filename_pattern)})
- Google Drive createdTime: ${stats.with_created_time} (${percent(stats.with_created_time)})
- Google Drive modifiedTime: ${stats.with_modified_time} (${percent(stats.with_modified_time)})
- No date found: ${stats.without_date} (${percent(stats.without_date)})

Year coverage: ${((1 - stats.without_date / stats.total_files) * 100).toFixed(1)}%
Year range: ${stats.earliest_year || '?'} - ${stats.latest_year || '?'}
Average year: ${stats.average_year || '?'}

Year distribution:
${Object.entries(stats.year_distribution)
  .sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10))
  .map(([year, count]) => `  ${year}: ${count} files (${((count / stats.total_files) * 100).toFixed(1)}%)`)
  .join('\n')}

================================================
    `
  }
}

// Singleton instance para tracking durante la sesión
export const diagnosticsCollector = new DateDiagnosticsCollector()
