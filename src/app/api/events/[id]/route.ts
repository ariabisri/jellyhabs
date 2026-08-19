import { NextResponse } from "next/server"
import { z } from "zod"
import { query, pool } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateEventSchema = z.object({
  station_id: z.string().min(1, "Stasiun monitoring harus dipilih"),
  event_start_date: z.string().min(1, "Tanggal mulai kejadian harus diisi"),
  event_end_date: z.string().nullable().optional(),
  event_type: z.enum(["Harmful Algal Blooms", "Jellyfish Bloom"]),
  severity_level: z.enum(["rendah", "sedang", "tinggi", "kritis"]),
  alert_status: z.enum(["Normal", "Waspada", "Siaga", "Darurat"]),
  description: z.string().optional().default(""),
  impact_assessment: z.string().optional().default(""),
  response_action: z.string().optional().default(""),
  water_quality_ids: z.array(z.string()).optional().default([]),
  plankton_ids: z.array(z.string()).optional().default([]),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sql = `
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
      WHERE e.id = $1
      LIMIT 1
    `
    const result = await query(sql, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Kejadian tidak ditemukan",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("GET /api/events/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data kejadian",
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
          error: "Autentikasi diperlukan",
        },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const result = updateEventSchema.safeParse(body)

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

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const updateSql = `
        UPDATE bloom_events
        SET 
          station_id = $1,
          event_start_date = $2,
          event_end_date = $3,
          event_type = $4,
          severity_level = $5,
          alert_status = $6,
          description = $7,
          impact_assessment = $8,
          response_action = $9
        WHERE id = $10
        RETURNING id, event_code, event_start_date, event_end_date, event_type, alert_status
      `

      const updateRes = await client.query(updateSql, [
        station_id,
        event_start_date,
        event_end_date || null,
        event_type,
        severity_level,
        alert_status,
        description.trim(),
        impact_assessment.trim(),
        response_action.trim(),
        id,
      ])

      if (updateRes.rows.length === 0) {
        await client.query("ROLLBACK")
        return NextResponse.json(
          {
            success: false,
            error: "Kejadian tidak ditemukan",
          },
          { status: 404 }
        )
      }

      // Re-sync Water Quality relations
      await client.query(`DELETE FROM bloom_event_water_quality WHERE bloom_event_id = $1`, [id])
      if (water_quality_ids && water_quality_ids.length > 0) {
        for (const wqId of water_quality_ids) {
          await client.query(
            `INSERT INTO bloom_event_water_quality (bloom_event_id, water_quality_record_id, relationship_notes)
             VALUES ($1, $2, $3)
             ON CONFLICT (bloom_event_id, water_quality_record_id) DO NOTHING`,
            [id, wqId, "Parameter kualitas air terkait kejadian blooming"]
          )
        }
      }

      // Re-sync Plankton relations
      await client.query(`DELETE FROM bloom_event_plankton WHERE bloom_event_id = $1`, [id])
      if (plankton_ids && plankton_ids.length > 0) {
        for (const pId of plankton_ids) {
          await client.query(
            `INSERT INTO bloom_event_plankton (bloom_event_id, plankton_record_id, relationship_notes)
             VALUES ($1, $2, $3)
             ON CONFLICT (bloom_event_id, plankton_record_id) DO NOTHING`,
            [id, pId, "Data plankton/ubur-ubur terkait kejadian"]
          )
        }
      }

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: "Data kejadian berhasil diperbarui",
        data: updateRes.rows[0],
      })
    } catch (dbErr) {
      await client.query("ROLLBACK")
      throw dbErr
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("PUT /api/events/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memperbarui data kejadian",
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
          error: "Autentikasi diperlukan",
        },
        { status: 401 }
      )
    }

    const { id } = await params

    const deleteRes = await query(`DELETE FROM bloom_events WHERE id = $1 RETURNING id`, [id])

    if (deleteRes.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Kejadian tidak ditemukan",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Kejadian berhasil dihapus",
    })
  } catch (error) {
    console.error("DELETE /api/events/[id] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Gagal menghapus kejadian",
      },
      { status: 500 }
    )
  }
}
