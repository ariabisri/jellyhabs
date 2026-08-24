import { NextResponse } from "next/server"
import { z } from "zod"
import { query, pool } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createEventSchema = z.object({
  event_code: z.string().min(3, "Kode kejadian minimal 3 karakter"),
  station_id: z.string().min(1, "Stasiun monitoring harus dipilih"),
  event_start_date: z.string().min(1, "Tanggal mulai kejadian harus diisi"),
  event_end_date: z.string().nullable().optional(),
  event_type: z.enum(["Harmful Algal Blooms", "Jellyfish Bloom"]),
  severity_level: z.enum(["rendah", "sedang", "tinggi", "kritis"]).default("sedang"),
  alert_status: z.enum(["Normal", "Waspada", "Siaga", "Darurat"]).default("Waspada"),
  description: z.string().optional().default(""),
  impact_assessment: z.string().optional().default(""),
  response_action: z.string().optional().default(""),
  water_quality_ids: z.array(z.string()).optional().default([]),
  plankton_ids: z.array(z.string()).optional().default([]),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("q") || ""
    const stationId = searchParams.get("station_id") || ""
    const eventType = searchParams.get("event_type") || ""
    const alertStatus = searchParams.get("alert_status") || ""

    let sql = `
      SELECT 
        e.id, 
        e.event_code, 
        e.station_id, 
        s.name AS station_name,
        s.station_code,
        s.city,
        s.province,
        s.latitude,
        s.longitude,
        TO_CHAR(e.event_start_date, 'YYYY-MM-DD') AS event_start_date,
        TO_CHAR(e.event_end_date, 'YYYY-MM-DD') AS event_end_date,
        e.event_type, 
        e.severity_level, 
        e.alert_status, 
        e.description, 
        e.impact_assessment, 
        e.response_action, 
        e.reported_by,
        u_rep.full_name AS reporter_name,
        e.validated_by,
        u_val.full_name AS validator_name,
        e.validated_at,
        e.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', wq.id,
                'record_code', wq.record_code,
                'temperature_c', wq.temperature_c,
                'salinity_psu', wq.salinity_psu,
                'dissolved_oxygen_mgl', wq.dissolved_oxygen_mgl,
                'ph', wq.ph,
                'chlorophyll_a_ugl', wq.chlorophyll_a_ugl,
                'notes', bwq.relationship_notes
              )
            )
            FROM bloom_event_water_quality bwq
            JOIN water_quality_records wq ON bwq.water_quality_record_id = wq.id
            WHERE bwq.bloom_event_id = e.id
          ),
          '[]'::json
        ) AS water_quality_records,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pr.id,
                'record_code', pr.record_code,
                'species_name', sm.scientific_name,
                'organism_category', sm.organism_category,
                'density_value', pr.density_value,
                'density_unit', pr.density_unit,
                'toxicity_status', pr.toxicity_status,
                'notes', bp.relationship_notes
              )
            )
            FROM bloom_event_plankton bp
            JOIN plankton_records pr ON bp.plankton_record_id = pr.id
            JOIN species_master sm ON pr.species_id = sm.id
            WHERE bp.bloom_event_id = e.id
          ),
          '[]'::json
        ) AS plankton_records
      FROM bloom_events e
      JOIN monitoring_stations s ON e.station_id = s.id
      LEFT JOIN users u_rep ON e.reported_by = u_rep.id
      LEFT JOIN users u_val ON e.validated_by = u_val.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (searchQuery.trim()) {
      params.push(`%${searchQuery.trim().toLowerCase()}%`)
      sql += ` AND (LOWER(e.event_code) LIKE $${params.length} OR LOWER(s.name) LIKE $${params.length} OR LOWER(e.description) LIKE $${params.length})`
    }

    if (stationId.trim()) {
      params.push(stationId.trim())
      sql += ` AND e.station_id = $${params.length}`
    }

    if (eventType.trim()) {
      params.push(eventType.trim())
      sql += ` AND e.event_type = $${params.length}`
    }

    if (alertStatus.trim()) {
      params.push(alertStatus.trim())
      sql += ` AND e.alert_status = $${params.length}`
    }

    sql += ` ORDER BY e.event_start_date DESC, e.created_at DESC`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("GET /api/events Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data kejadian",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Autentikasi diperlukan untuk mencatat kejadian",
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createEventSchema.safeParse(body)

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
      event_code,
      station_id,
      event_start_date,
      event_end_date,
      event_type,
      severity_level,
      alert_status,
      description,
      impact_assessment,
      response_action,
      water_quality_ids,
      plankton_ids,
    } = result.data

    // Check unique event_code
    const existingCode = await query(`SELECT id FROM bloom_events WHERE LOWER(event_code) = $1 LIMIT 1`, [
      event_code.toLowerCase().trim(),
    ])

    if (existingCode.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Kode kejadian sudah digunakan",
        },
        { status: 400 }
      )
    }

    // Verify station exists
    const stationCheck = await query(`SELECT id FROM monitoring_stations WHERE id = $1 LIMIT 1`, [station_id])
    if (stationCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stasiun monitoring tidak ditemukan",
        },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const insertEventSql = `
        INSERT INTO bloom_events (
          event_code, station_id, event_start_date, event_end_date,
          event_type, severity_level, alert_status,
          description, impact_assessment, response_action,
          reported_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, event_code, event_start_date, event_end_date, event_type, alert_status
      `
      const eventRes = await client.query(insertEventSql, [
        event_code.trim(),
        station_id,
        event_start_date,
        event_end_date || null,
        event_type,
        severity_level,
        alert_status,
        description.trim(),
        impact_assessment.trim(),
        response_action.trim(),
        session.id,
      ])

      const newEventId = eventRes.rows[0].id

      // Link Water Quality Records
      if (water_quality_ids && water_quality_ids.length > 0) {
        for (const wqId of water_quality_ids) {
          await client.query(
            `INSERT INTO bloom_event_water_quality (bloom_event_id, water_quality_record_id, relationship_notes)
             VALUES ($1, $2, $3)
             ON CONFLICT (bloom_event_id, water_quality_record_id) DO NOTHING`,
            [newEventId, wqId, "Parameter kualitas air terkait kejadian blooming"]
          )
        }
      }

      // Link Plankton Records
      if (plankton_ids && plankton_ids.length > 0) {
        for (const pId of plankton_ids) {
          await client.query(
            `INSERT INTO bloom_event_plankton (bloom_event_id, plankton_record_id, relationship_notes)
             VALUES ($1, $2, $3)
             ON CONFLICT (bloom_event_id, plankton_record_id) DO NOTHING`,
            [newEventId, pId, "Data plankton/ubur-ubur terkait kejadian"]
          )
        }
      }

      await client.query("COMMIT")

      return NextResponse.json(
        {
          success: true,
          message: "Kejadian blooming berhasil dicatat",
          data: eventRes.rows[0],
        },
        { status: 201 }
      )
    } catch (dbErr) {
      await client.query("ROLLBACK")
      throw dbErr
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("POST /api/events Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mencatat kejadian baru",
      },
      { status: 500 }
    )
  }
}
