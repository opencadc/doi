import React from 'react'
import versionInfo from '@/version.json'

export function VersionInfo() {
  return (
    <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
      {versionInfo.version}@{versionInfo.date}
    </div>
  )
}
