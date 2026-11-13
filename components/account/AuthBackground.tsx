"use client"

import React, { memo } from "react"

export const AuthBackground = memo(function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      style={{ contain: "strict" }}
    >
      {/* Base warm ambient gradient */}
      <div className="absolute inset-0 bg-hero opacity-85" />

      {/* Dynamic Living Gravity Mesh Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 1. Saffron / Golden Honey Flame Orb */}
        <div className="auth-mesh-orb auth-mesh-orb-1 animate-living-mesh-1" />

        {/* 2. Sunset Coral / Rose Radiance Orb */}
        <div className="auth-mesh-orb auth-mesh-orb-2 animate-living-mesh-2" />

        {/* 3. Golden Amber / Tangerine Sunbeam Orb */}
        <div className="auth-mesh-orb auth-mesh-orb-3 animate-living-mesh-3" />

        {/* 4. Deep Coral / Terracotta Gravity Orb */}
        <div className="auth-mesh-orb auth-mesh-orb-4 animate-living-mesh-4" />
      </div>
    </div>
  )
})
