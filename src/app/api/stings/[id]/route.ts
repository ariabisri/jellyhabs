import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveBeachCoordinates } from "@/lib/beach-coordinates"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sql = `
      SELECT 
        sr.*,
        b.name as beach_master_name,
        b.village as beach_village,
        b.subdistrict as beach_subdistrict,
        b.sar_post_name as beach_sar_post,
        ms.station_code,
        ms.name as station_name,
        be.event_code as bloom_event_code,
        be.event_type as bloom_event_type,
        u.full_name as reported_by_name
      FROM sting_records sr
      LEFT JOIN monitoring_stations ms ON sr.station_id = ms.id
      LEFT JOIN beaches b ON sr.beach_id = b.id
      LEFT JOIN bloom_events be ON sr.bloom_event_id = be.id
      LEFT JOIN users u ON sr.reported_by = u.id
      WHERE sr.id = $1
    `
    const res = await query(sql, [id])
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data insiden sengatan tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: res.rows[0] })
  } catch (error) {
    console.error("GET /api/stings/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail insiden sengatan" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk mengubah data" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const {
      incident_date,
      incident_time,
      location_name,
      beach_id,
      latitude,
      longitude,
      station_id,
      bloom_event_id,
      victim_count,
      victim_name,
      victim_age,
      victim_gender,
      severity_level,
      treatment_notes,
    } = body

    let resolvedLocationName = location_name ? location_name.trim() : null
    let lat = latitude ? parseFloat(latitude) : null
    let lng = longitude ? parseFloat(longitude) : null
    let resolvedStationId = station_id || null

    if (beach_id) {
      const bRes = await query<{
        name: string
        latitude: number
        longitude: number
        station_id: string
      }>("SELECT name, latitude, longitude, station_id FROM beaches WHERE id::text = $1", [
        beach_id,
      ])
      if (bRes.rows.length > 0) {
        const b = bRes.rows[0]
        if (!resolvedLocationName) resolvedLocationName = b.name
        if (!lat) lat = Number(b.latitude)
        if (!lng) lng = Number(b.longitude)
        if (!resolvedStationId) resolvedStationId = b.station_id
      }
    }

    if ((!lat || !lng) && resolvedLocationName) {
      const resolved = resolveBeachCoordinates(resolvedLocationName)
      lat = resolved[0]
      lng = resolved[1]
    }

    const updateSql = `
      UPDATE sting_records
      SET
        incident_date = COALESCE($1, incident_date),
        incident_time = $2,
        location_name = COALESCE($3, location_name),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        station_id = $6,
        beach_id = $7,
        bloom_event_id = $8,
        victim_count = COALESCE($9, victim_count),
        victim_name = $10,
        victim_age = $11,
        victim_gender = $12,
        severity_level = COALESCE($13, severity_level),
        treatment_notes = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `

    const res = await query(updateSql, [
      incident_date,
      incident_time || null,
      resolvedLocationName,
      lat,
      lng,
      resolvedStationId,
      beach_id || null,
      bloom_event_id || null,
      victim_count ? Math.max(1, parseInt(victim_count, 10)) : null,
      victim_name?.trim() || null,
      victim_age?.trim() || null,
      victim_gender || null,
      severity_level || null,
      treatment_notes || null,
      id,
    ])

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data insiden sengatan tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data insiden sengatan berhasil diperbarui",
      data: res.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/stings/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data insiden sengatan" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Autentikasi diperlukan untuk menghapus data" },
        { status: 401 }
      )
    }

    const { id } = await params
    const res = await query(`DELETE FROM sting_records WHERE id = $1 RETURNING id`, [id])

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data insiden sengatan tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Data insiden sengatan berhasil dihapus",
    })
  } catch (error) {
    console.error("DELETE /api/stings/[id] Error:", error)
    return NextResponse.json(
      { success: false, error: "Gagal menghapus data insiden sengatan" },
      { status: 500 }
    )
  }
}
