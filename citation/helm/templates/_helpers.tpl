{{/*
Expand the name of the chart.
*/}}
{{- define "citation.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "citation.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "citation.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "citation.labels" -}}
helm.sh/chart: {{ include "citation.chart" . }}
{{ include "citation.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "citation.selectorLabels" -}}
app.kubernetes.io/name: {{ include "citation.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "citation.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "citation.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Tomcat catalina.properties connector settings for cadc-tomcat server.xml.
Prefer Ingress, then HTTPRoute, else optional tomcat.connector overrides.
See: https://github.com/opencadc/docker-base/tree/main/cadc-tomcat
*/}}
{{- define "citation.tomcatConnectorProxyName" -}}
{{- if and .Values.ingress.enabled .Values.ingress.hosts (gt (len .Values.ingress.hosts) 0) -}}
{{- (index .Values.ingress.hosts 0).host -}}
{{- else if and .Values.httpRoute.enabled .Values.httpRoute.hostnames (gt (len .Values.httpRoute.hostnames) 0) -}}
{{- index .Values.httpRoute.hostnames 0 -}}
{{- else -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- index $conn "proxyName" | default "hostname.example.com" -}}
{{- end -}}
{{- end }}

{{- define "citation.tomcatConnectorScheme" -}}
{{- if and .Values.ingress.enabled .Values.ingress.hosts (gt (len .Values.ingress.hosts) 0) -}}
{{- if and .Values.ingress.tls (gt (len .Values.ingress.tls) 0) -}}https{{- else -}}http{{- end -}}
{{- else if and .Values.httpRoute.enabled .Values.httpRoute.hostnames (gt (len .Values.httpRoute.hostnames) 0) -}}
https
{{- else -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- index $conn "scheme" | default "https" -}}
{{- end -}}
{{- end }}

{{- define "citation.tomcatConnectorProxyPort" -}}
{{- if and .Values.ingress.enabled .Values.ingress.hosts (gt (len .Values.ingress.hosts) 0) -}}
{{- if and .Values.ingress.tls (gt (len .Values.ingress.tls) 0) -}}443{{- else -}}80{{- end -}}
{{- else if and .Values.httpRoute.enabled .Values.httpRoute.hostnames (gt (len .Values.httpRoute.hostnames) 0) -}}
443
{{- else -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- index $conn "proxyPort" | default "443" | toString -}}
{{- end -}}
{{- end }}

{{- define "citation.tomcatConnectorSecure" -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- if hasKey $conn "secure" -}}
{{- $conn.secure | toString -}}
{{- else if eq (include "citation.tomcatConnectorScheme" .) "https" -}}
true
{{- else -}}
false
{{- end -}}
{{- end }}

{{- define "citation.tomcatConnectorConnectionTimeout" -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- index $conn "connectionTimeout" | default "20000" | toString -}}
{{- end }}

{{- define "citation.tomcatConnectorKeepAliveTimeout" -}}
{{- $conn := index (.Values.tomcat | default dict) "connector" | default dict -}}
{{- index $conn "keepAliveTimeout" | default "120000" | toString -}}
{{- end }}
