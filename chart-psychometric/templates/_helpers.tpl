{{/*
Expand the name of the chart.
*/}}
{{- define "chart-psychometric.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "chart-psychometric.labels" -}}
app.kubernetes.io/name: {{ include "chart-psychometric.name" .root }}
{{- if .component }}
app.kubernetes.io/component: {{ .component }}
{{- end }}
{{- end }}

{{/*
Render resource requests/limits
*/}}
{{- define "chart-psychometric.backend-resources" -}}
{{- if .Values.backend.resources }}
resources:
  {{- toYaml .Values.backend.resources | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Render resource requests/limits
*/}}
{{- define "chart-psychometric.frontend-resources" -}}
{{- if .Values.frontend.resources }}
resources:
  {{- toYaml .Values.frontend.resources | nindent 2 }}
{{- end }}
{{- end }}