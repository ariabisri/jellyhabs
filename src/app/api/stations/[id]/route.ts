import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateStationSchema = z.object({
  station_code: z
    .string()
    .min(2, "Kode stasiun minimal 2 karakter")
    .max(20, "Kode stasiun maksimal 20 karakter")
    .trim(),
  name: z
    .string()
    .min(2, "Nama stasiun minimal 2 karakter")
    .max(255, "Nama stasiun maksimal 255 karakter")
    .trim(),
  province: z
    .string()
    .min(2, "Provinsi minimal 2 karakter")
    .max(100, "Provinsi maksimal 100 karakter")
    .trim(),
  city: z
    .string()
    .min(2, "Kabupaten/Kota minimal 2 karakter")
    .max(100, "Kabupaten/Kota maksimal 100 karakter")
    .trim(),
  latitude: z
    .number({ message: "Latitude harus berupa angka numerik" })
    .min(-90, "Latitude minimal -90")
    .max(90, "Latitude maksimal 90"),
  longitude: z
    .number({ message: "Longitude harus berupa angka numerik" })
    .min(-180, "Longitude minimal -180")
    .max(180, "Longitude maksimal 180"),
  description: z.string().optional().default(""),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    // Find station by UUID id OR station_code
    const stationSql = `
      SELECT 
        s.id,
        s.station_code,
        s.name,
        s.province,
        s.city,
        s.latitude,
        s.longitude,
        s.description,
        s.status,
        s.created_at,
        s.updated_at
      FROM monitoring_stations s
      WHERE s.id::text = $1 OR LOWER(s.station_code) = LOWER($1)
      LIMIT 1
    `
    const stationRes = await query(stationSql, [decodedId])

    if (stationRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stasiun monitoring tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const station = stationRes.rows[0]
    const stationId = station.id

    // Fetch related sampling events
    const samplingSql = `
      SELECT 
        se.id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        TO_CHAR(se.sampling_time, 'HH24:MI') AS sampling_time,
        se.weather_condition,
        se.field_notes,
        u.full_name AS recorded_by_name,
        (
          SELECT COUNT(*)::int 
          FROM water_quality_records wq 
          WHERE wq.sampling_event_id = se.id
        ) AS water_quality_count,
        (
          SELECT COUNT(*)::int 
          FROM plankton_records pr 
          WHERE pr.sampling_event_id = se.id
        ) AS plankton_count
      FROM sampling_events se
      LEFT JOIN users u ON se.recorded_by = u.id
      WHERE se.station_id = $1
      ORDER BY se.sampling_date DESC, se.created_at DESC
    `
    const samplingRes = await query(samplingSql, [stationId])

    // Fetch related water quality records
    const wqSql = `
      SELECT 
        wq.id,
        wq.record_code,
        wq.sampling_event_id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        wq.temperature_c,
        wq.salinity_psu,
        wq.dissolved_oxygen_mgl,
        wq.ph,
        wq.chlorophyll_a_ugl,
        wq.turbidity_ntu,
        wq.current_speed_ms,
        wq.depth_m,
        wq.notes,
        wq.created_at
      FROM water_quality_records wq
      JOIN sampling_events se ON wq.sampling_event_id = se.id
      WHERE se.station_id = $1
      ORDER BY se.sampling_date DESC, wq.created_at DESC
    `
    const wqRes = await query(wqSql, [stationId])

    // Fetch related plankton records
    const planktonSql = `
      SELECT 
        pr.id,
        pr.record_code,
        pr.sampling_event_id,
        se.sampling_code,
        TO_CHAR(se.sampling_date, 'YYYY-MM-DD') AS sampling_date,
        sm.id AS species_id,
        sm.species_code,
        sm.scientific_name,
        sm.common_name,
        sm.organism_category,
        sm.is_toxic,
        pr.density_value,
        pr.density_unit,
        pr.toxicity_status,
        pr.morphological_notes,
        pr.created_at
      FROM plankton_records pr
      JOIN species_master sm ON pr.species_id = sm.id
      JOIN sampling_events se ON pr.sampling_event_id = se.id
      WHERE se.station_id = $1
      ORDER BY se.sampling_date DESC, pr.created_at DESC
    `
    const planktonRes = await query(planktonSql, [stationId])

    // Fetch related bloom events
    const eventsSql = `
      SELECT 
        be.id,
        be.event_code,
        TO_CHAR(be.event_start_date, 'YYYY-MM-DD') AS event_start_date,
        TO_CHAR(be.event_end_date, 'YYYY-MM-DD') AS event_end_date,
        be.event_type,
        be.severity_level,
        be.alert_status,
        be.description,
        be.impact_assessment,
        be.response_action,
        u.full_name AS reporter_name,
        be.created_at
      FROM bloom_events be
      LEFT JOIN users u ON be.reported_by = u.id
      WHERE be.station_id = $1
      ORDER BY be.event_start_date DESC, be.created_at DESC
    `
    const eventsRes = await query(eventsSql, [stationId])

    return NextResponse.json({
      success: true,
      data: {
        ...station,
        sampling_events: samplingRes.rows,
        water_quality_records: wqRes.rows,
        plankton_records: planktonRes.rows,
        bloom_events: eventsRes.rows,
        counts: {
          sampling_count: samplingRes.rows.length,
          water_quality_count: wqRes.rows.length,
          plankton_count: planktonRes.rows.length,
          bloom_events_count: eventsRes.rows.length,
        },
      },
    })
  } catch (error) {
    console.error("GET /api/stations/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil detail stasiun monitoring",
      },
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
        {
          success: false,
          error: "Autentikasi diperlukan untuk mengubah data stasiun monitoring",
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    const body = await request.json()
    const result = updateStationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      )
    }

    const {
      station_code,
      name,
      province,
      city,
      latitude,
      longitude,
      description,
      status,
    } = result.data

    // Check if station exists
    const findStation = await query(
      `SELECT id FROM monitoring_stations WHERE id::text = $1 OR LOWER(station_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findStation.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stasiun monitoring tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const targetId = findStation.rows[0].id

    // Check if new station_code collides with another station
    const codeConflict = await query(
      `SELECT id FROM monitoring_stations WHERE LOWER(station_code) = $1 AND id != $2 LIMIT 1`,
      [station_code.toLowerCase(), targetId]
    )

    if (codeConflict.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode stasiun '${station_code}' sudah digunakan oleh stasiun lain`,
        },
        { status: 400 }
      )
    }

    const updateSql = `
      UPDATE monitoring_stations
      SET 
        station_code = $1,
        name = $2,
        province = $3,
        city = $4,
        latitude = $5,
        longitude = $6,
        description = $7,
        status = $8
      WHERE id = $9
      RETURNING id, station_code, name, province, city, latitude, longitude, description, status, created_at, updated_at
    `
    const updateRes = await query(updateSql, [
      station_code,
      name,
      province,
      city,
      latitude,
      longitude,
      description.trim() || null,
      status,
      targetId,
    ])

    return NextResponse.json({
      success: true,
      message: "Data stasiun monitoring berhasil diperbarui",
      data: updateRes.rows[0],
    })
  } catch (error) {
    console.error("PUT /api/stations/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui data stasiun monitoring",
      },
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
        {
          success: false,
          error: "Autentikasi diperlukan untuk menghapus stasiun monitoring",
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id).trim()

    // Find station
    const findStation = await query(
      `SELECT id, station_code, name FROM monitoring_stations WHERE id::text = $1 OR LOWER(station_code) = LOWER($1) LIMIT 1`,
      [decodedId]
    )

    if (findStation.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stasiun monitoring tidak ditemukan",
        },
        { status: 404 }
      )
    }

    const targetId = findStation.rows[0].id
    const stationCode = findStation.rows[0].station_code

    // Check for dependent records
    const samplingCheck = await query(
      `SELECT COUNT(*)::int AS count FROM sampling_events WHERE station_id = $1`,
      [targetId]
    )
    const bloomCheck = await query(
      `SELECT COUNT(*)::int AS count FROM bloom_events WHERE station_id = $1`,
      [targetId]
    )
    const datasetCheck = await query(
      `SELECT COUNT(*)::int AS count FROM datasets WHERE station_id = $1`,
      [targetId]
    )

    const totalSampling = samplingCheck.rows[0]?.count || 0
    const totalBlooms = bloomCheck.rows[0]?.count || 0
    const totalDatasets = datasetCheck.rows[0]?.count || 0

    if (totalSampling > 0 || totalBlooms > 0 || totalDatasets > 0) {
      const dependencies: string[] = []
      if (totalSampling > 0) dependencies.push(`${totalSampling} kegiatan sampling`)
      if (totalBlooms > 0) dependencies.push(`${totalBlooms} kejadian blooming`)
      if (totalDatasets > 0) dependencies.push(`${totalDatasets} berkas dataset`)

      return NextResponse.json(
        {
          success: false,
          error: `Tidak dapat menghapus stasiun '${stationCode}' karena masih memiliki relasi data: ${dependencies.join(", ")}. Hapus atau pindahkan data terkait terlebih dahulu.`,
        },
        { status: 409 }
      )
    }

    const deleteRes = await query(
      `DELETE FROM monitoring_stations WHERE id = $1 RETURNING id`,
      [targetId]
    )

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stasiun monitoring tidak ditemukan",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Stasiun monitoring '${stationCode}' berhasil dihapus`,
    })
  } catch (error) {
    console.error("DELETE /api/stations/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus stasiun monitoring",
      },
      { status: 500 }
    )
  }
}
