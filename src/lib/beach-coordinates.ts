export const BEACH_COORDINATES: Record<string, [number, number]> = {
  sepanjang: [-8.1347, 110.5592],
  kukup: [-8.134, 110.5532],
  krakal: [-8.145, 110.5985],
  drini: [-8.1362, 110.5776],
  sundak: [-8.1473, 110.608],
  "pulang sawal": [-8.1502, 110.612],
  indrayanti: [-8.1502, 110.612],
  baron: [-8.1287, 110.5488],
  sadranan: [-8.1465, 110.6032],
  ngrawe: [-8.1345, 110.5555],
  mesra: [-8.1345, 110.5555],
  ngandong: [-8.147, 110.607],
  "watu kodok": [-8.138, 110.5695],
  slili: [-8.146, 110.602],
  timang: [-8.175, 110.662],
  jungwok: [-8.188, 110.708],
  siung: [-8.182, 110.683],
  ngobaran: [-8.123, 110.505],
  ngrenehan: [-8.122, 110.509],
  gesing: [-8.118, 110.493],
  parangtritis: [-8.0256, 110.3188],
  depok: [-8.016, 110.292],
}

export function resolveBeachCoordinates(locationName: string): [number, number] {
  if (!locationName) return [-8.135, 110.57]
  const norm = locationName.toLowerCase().trim()
  for (const [key, coords] of Object.entries(BEACH_COORDINATES)) {
    if (norm.includes(key)) {
      return coords
    }
  }
  return [-8.135, 110.57] // default Gunung Kidul coast
}
