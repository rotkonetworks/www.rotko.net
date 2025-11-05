export interface RackDevice {
 name: string
 bottom_u: number
 height_u: number
 color: string
 type?: string
 details?: string
}

export interface RackConfig {
 rack_u: number
 unit_px: number
 rack_width: number
 label_width: number
 devices: RackDevice[]
}

export const rackConfiguration: RackConfig = {
 rack_u: 49,
 unit_px: 20,
 rack_width: 200,
 label_width: 50,
 devices: [
   { name: "bkk07", bottom_u: 1, height_u: 2, color: "#00FFE5", details: "EPYC 9654 Storage/Compute" },
   { name: "bkk06", bottom_u: 3, height_u: 2, color: "#00FFE5", type: "Server", details: "EPYC 7713 Storage/Compute" },
   { name: "bkk08", bottom_u: 5, height_u: 2, color: "#00FFE5", type: "Server", details: "EPYC 7742 Storage/Compute" },
   { name: "bkk30", bottom_u: 7, height_u: 1, color: "#FFB366", type: "Switch", details: "Storage Network Switch A" },
   { name: "bkk40", bottom_u: 8, height_u: 1, color: "#FFB366", type: "Switch", details: "Storage Network Switch B" },
   { name: "SAX", bottom_u: 10, height_u: 1, color: "#66FFB3", type: "Firewall", details: "Primary Firewall/Router" },
   { name: "bkk11", bottom_u: 12, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 5950X Validator Node" },
   { name: "bkk12", bottom_u: 13, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 9 7950X3D Validator Node" },
   { name: "bkk13", bottom_u: 14, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 5950X Validator Node" },
   { name: "bkk04", bottom_u: 20, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 7950X Validator Node" },
   { name: "bkk03", bottom_u: 21, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 9950X Validator Node" },
   { name: "bkk50", bottom_u: 22, height_u: 1, color: "#4DFFCC", type: "Router", details: "MikroTik CCR2004 Core Router (Fallback)" },
   { name: "bkk00", bottom_u: 23, height_u: 1, color: "#66D9FF", type: "Router", details: "MikroTik CCR2216 Edge Router" },
   { name: "bkk20", bottom_u: 24, height_u: 1, color: "#66D9FF", type: "Router", details: "MikroTik CCR2216 Edge Router" },
   { name: "bkk10", bottom_u: 25, height_u: 1, color: "#4DFFCC", type: "Router", details: "MikroTik CCR2116 Core Router (Primary)" },
   { name: "bkk60", bottom_u: 26, height_u: 1, color: "#FFB366", type: "Switch", details: "Management Switch (IPMI)" },
   { name: "bkk02", bottom_u: 28, height_u: 1, color: "#B3E6FF", type: "Validator", details: "Ryzen 5600G Validator Node" },
   { name: "bkk09", bottom_u: 29, height_u: 1, color: "#66FFB3", type: "Validator", details: "Ryzen 7945HX Validator Node" },
   { name: "bkk01", bottom_u: 31, height_u: 1, color: "#B3E6FF", type: "Validator", details: "Ryzen 5600G Validator Node" },
   { name: "Uplink", bottom_u: 49, height_u: 1, color: "#FFE666", type: "Uplink", details: "Primary Network Uplink Panel" }
 ]
}
